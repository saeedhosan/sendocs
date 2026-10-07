<?php

declare(strict_types=1);

use App\Auth\Services\CsrfTokenService;
use App\Models\AuthIdentity;
use App\Models\Session;
use App\Models\User;
use Illuminate\Cache\RateLimiter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

beforeEach(function (): void {
    $this->withCredentials();

    $this->owner = User::factory()->create([
        'email'    => 'ada@example.com',
        'password' => Hash::make('analytical-engine'),
    ]);
});

/**
 * Change the password as the owner holding $session's cookie.
 */
function changePassword(
    Session $session,
    string $currentPassword = 'analytical-engine',
    string $password = 'difference-engine',
    ?string $csrf = null,
) {
    return test()->postJson('/api/v1/auth/password/change', [
        'currentPassword' => $currentPassword,
        'password'        => $password,
    ], array_filter(['X-CSRF-Token' => $csrf ?? csrfFor($session)]));
}

it('changes the password and leaves the caller signed in', function (): void {
    [$session] = signInAndKeepToken();

    $response = changePassword($session);

    $response->assertNoContent();

    expect($response->getContent())->toBe('');

    expect(Hash::check('difference-engine', $this->owner->fresh()->password))->toBeTrue()
        ->and(Hash::check('analytical-engine', $this->owner->fresh()->password))->toBeFalse()
        ->and(Session::query()->find($session->getKey()))->not->toBeNull();

    // Still signed in on the same cookie, with the same CSRF token.
    $this->getJson('/api/v1/auth/session')
        ->assertOk()
        ->assertJsonPath('user.id', $this->owner->getKey())
        ->assertJsonPath('csrfToken', app(CsrfTokenService::class)->derive($session->getKey()));
});

it('revokes every other session', function (): void {
    [$laptop, $laptopToken] = signInAndKeepToken();
    [$phone]                = signInAndKeepToken();

    $this->withUnencryptedCookies([sessionCookieName() => $laptopToken]);
    Auth::forgetGuards();

    changePassword($laptop)->assertNoContent();

    expect(Session::query()->count())->toBe(1)
        ->and(Session::query()->sole()->getKey())->toBe($laptop->getKey())
        ->and(Session::query()->find($phone->getKey()))->toBeNull();
});

it('rejects a wrong current password and changes nothing', function (): void {
    [$session] = signInAndKeepToken();

    $response = changePassword($session, 'not-the-password');

    $response->assertStatus(401)
        ->assertJsonPath('error.code', 'invalid_credentials');

    expect(Hash::check('analytical-engine', $this->owner->fresh()->password))->toBeTrue()
        ->and(Session::query()->count())->toBe(1)
        ->and(Session::query()->find($session->getKey()))->not->toBeNull();
});

it('refuses an account with no password and revokes nothing', function (): void {
    $google = User::factory()->create([
        'email'    => 'grace@example.com',
        'password' => null,
        'provider' => AuthIdentity::PROVIDER_GOOGLE,
    ]);

    // The password login refuses an account with no password, which is the point
    // of the 400 below, so the session is issued directly and its cookie read
    // back out of the queue.
    $googleSession = issueSessionFor($google);

    $this->withUnencryptedCookies([sessionCookieName() => queuedSessionToken()]);

    Auth::forgetGuards();

    $response = changePassword($googleSession, 'irrelevant');

    $response->assertStatus(400)
        ->assertJsonPath('error.code', 'password_not_supported')
        ->assertJsonPath('error.message', 'Password operations are not available for this account.');

    expect($google->fresh()->password)->toBeNull()
        ->and(Session::query()->find($googleSession->getKey()))->not->toBeNull();
});

it('requires a csrf token', function (): void {
    signInAndKeepToken();

    test()->postJson('/api/v1/auth/password/change', [
        'currentPassword' => 'analytical-engine',
        'password'        => 'difference-engine',
    ])
        ->assertStatus(403)
        ->assertJsonPath('error.code', 'csrf_failed');

    expect(Hash::check('analytical-engine', $this->owner->fresh()->password))->toBeTrue();
});

it('rejects a csrf token from another session', function (): void {
    [$first] = signInAndKeepToken();
    $foreign = csrfFor($first);

    [, $otherToken] = signInAndKeepToken();
    $this->withUnencryptedCookies([(string) config('session.owner_cookie.name') => $otherToken]);
    Auth::forgetGuards();

    test()->postJson('/api/v1/auth/password/change', [
        'currentPassword' => 'analytical-engine',
        'password'        => 'difference-engine',
    ], ['X-CSRF-Token' => $foreign])
        ->assertStatus(403)
        ->assertJsonPath('error.code', 'csrf_failed');
});

it('requires being signed in', function (): void {
    $this->postJson('/api/v1/auth/password/change', [
        'currentPassword' => 'analytical-engine',
        'password'        => 'difference-engine',
    ])
        ->assertStatus(401)
        ->assertJsonPath('error.code', 'unauthenticated');
});

it('validates the payload and keeps the old password', function (): void {
    [$session] = signInAndKeepToken();

    changePassword($session, 'analytical-engine', 'short')
        ->assertStatus(422)
        ->assertJsonStructure(['error' => ['details' => ['password']]]);

    changePassword($session, 'analytical-engine', str_repeat('a', 201))
        ->assertStatus(422)
        ->assertJsonStructure(['error' => ['details' => ['password']]]);

    // Middleware runs first, so this needs a token to reach validation at all.
    test()->postJson('/api/v1/auth/password/change', ['password' => 'difference-engine'], [
        'X-CSRF-Token' => csrfFor($session),
    ])
        ->assertStatus(422)
        ->assertJsonStructure(['error' => ['details' => ['currentPassword']]]);

    expect(Hash::check('analytical-engine', $this->owner->fresh()->password))->toBeTrue();
});

it('rate limits changes to 120 a minute per owner', function (): void {
    // The definition is checked rather than a run of 120 real changes: every one
    // of those would verify a bcrypt hash, which is the point of the cost.
    $request = Request::create('/api/v1/auth/password/change', 'POST');
    $request->setUserResolver(fn (): User => $this->owner);

    $limit = app(RateLimiter::class)->limiter('auth.password.change')($request);

    expect($limit->maxAttempts)->toBe(120)
        ->and($limit->decaySeconds)->toBe(60)
        ->and($limit->key)->toBe($this->owner->getKey());
});
