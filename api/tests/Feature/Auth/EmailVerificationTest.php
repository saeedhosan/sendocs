<?php

declare(strict_types=1);

use App\Auth\Notifications\VerifyEmailNotification;
use App\Auth\Services\AccountTokenService;
use App\Models\AccountToken;
use App\Models\AuthIdentity;
use App\Models\Session;
use App\Models\User;
use Illuminate\Cache\RateLimiter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

beforeEach(function (): void {
    $this->withCredentials();

    $this->owner = User::factory()->unverified()->create([
        'email'    => 'ada@example.com',
        'password' => Hash::make('analytical-engine'),
    ]);
});

/**
 * A live verification token for the owner, as registration would leave one.
 */
function issueVerificationToken(User $user): string
{
    return app(AccountTokenService::class)->issue($user, AccountToken::PURPOSE_EMAIL_VERIFICATION);
}

function verifyEmail(string $token)
{
    return test()->getJson('/api/v1/auth/email/verify?token='.$token);
}

function resendVerification(?string $csrf = 'unused')
{
    return test()->postJson('/api/v1/auth/email/resend', [], $csrf === null ? [] : [
        'X-CSRF-Token' => $csrf,
    ]);
}

it('redeems a live token and reports when the address was verified', function (): void {
    $token = issueVerificationToken($this->owner);

    verifyEmail($token)
        ->assertOk()
        ->assertJsonStructure(['emailVerifiedAt']);

    expect($this->owner->fresh()->email_verified_at)->not->toBeNull()
        ->and(AccountToken::query()->sole()->used_at)->not->toBeNull();
});

it('reports the same timestamp the user row holds', function (): void {
    $verifiedAt = now()->startOfSecond();

    $this->travelTo($verifiedAt);
    AccountToken::query()->create([
        'user_id'    => $this->owner->getKey(),
        'purpose'    => AccountToken::PURPOSE_EMAIL_VERIFICATION,
        'token_hash' => hash('sha256', 'a-raw-token'),
        'expires_at' => now()->addHour(),
    ]);

    $response = $this->getJson('/api/v1/auth/email/verify?token=a-raw-token');

    $response->assertOk();

    expect($response->json('emailVerifiedAt'))->toBe($verifiedAt->toIso8601String())
        ->and($this->owner->fresh()->email_verified_at->toIso8601String())->toBe($verifiedAt->toIso8601String());
});

it('rejects a replayed link with the same 410 as an unknown token', function (): void {
    $token = issueVerificationToken($this->owner);

    verifyEmail($token)->assertOk();

    $replay  = verifyEmail($token);
    $unknown = verifyEmail(str_repeat('a', 43));

    $replay->assertStatus(410)
        ->assertJsonPath('error.code', 'invalid_token')
        ->assertJsonPath('error.message', 'This link has expired or has already been used.');

    expect($unknown->content())->toBe($replay->content());
});

it('rejects an expired token', function (): void {
    $token = issueVerificationToken($this->owner);

    AccountToken::query()->sole()->update(['expires_at' => now()->subSecond()]);

    verifyEmail($token)
        ->assertStatus(410)
        ->assertJsonPath('error.code', 'invalid_token');

    expect($this->owner->fresh()->email_verified_at)->toBeNull();
});

it('will not accept a password reset token in place of a verification token', function (): void {
    $token = app(AccountTokenService::class)->issue($this->owner, AccountToken::PURPOSE_PASSWORD_RESET);

    verifyEmail($token)
        ->assertStatus(410)
        ->assertJsonPath('error.code', 'invalid_token');

    expect($this->owner->fresh()->email_verified_at)->toBeNull();
});

it('verifies an address registered through the api', function (): void {
    Notification::fake();

    $this->postJson('/api/v1/auth/register', [
        'name'     => 'Ada Lovelace',
        'email'    => 'Grace@Example.com',
        'password' => 'analytical-engine',
    ])->assertCreated();

    $registered = User::query()->where('email', 'grace@example.com')->sole();
    $row        = AccountToken::query()->where('user_id', $registered->getKey())->sole();

    expect($registered->email_verified_at)->toBeNull()
        ->and($row->used_at)->toBeNull();

    verifyEmail(rawVerificationToken())
        ->assertOk()
        ->assertJsonPath('emailVerifiedAt', $registered->fresh()->email_verified_at->toIso8601String());
});

it('leaves the first verification timestamp in place for a second link', function (): void {
    $first = now()->subDay()->startOfSecond();
    $this->owner->forceFill(['email_verified_at' => $first])->save();

    $response = verifyEmail(issueVerificationToken($this->owner));

    $response->assertOk();

    expect($response->json('emailVerifiedAt'))->toBe($first->toIso8601String())
        ->and($this->owner->fresh()->email_verified_at->timestamp)->toBe($first->timestamp);
});

it('needs no session to redeem a link', function (): void {
    $token = issueVerificationToken($this->owner);

    verifyEmail($token)->assertOk();

    expect(Session::query()->count())->toBe(0);
});

it('validates the token parameter', function (): void {
    $this->getJson('/api/v1/auth/email/verify')
        ->assertStatus(422)
        ->assertJsonStructure(['error' => ['details' => ['token']]]);

    verifyEmail(str_repeat('a', 201))
        ->assertStatus(422)
        ->assertJsonStructure(['error' => ['details' => ['token']]]);

    expect(AccountToken::query()->count())->toBe(0);
});

it('rate limits redemption to 5 an hour per address', function (): void {
    // The definition is checked rather than a run of 5 real redemptions, because
    // every request after the first would be a 410 anyway.
    $request = Request::create('/api/v1/auth/email/verify', 'GET');
    $request->server->set('REMOTE_ADDR', '203.0.113.7');

    $limit = app(RateLimiter::class)->limiter('auth.email.verify')($request);

    expect($limit->maxAttempts)->toBe(5)
        ->and($limit->decaySeconds)->toBe(3600)
        ->and($limit->key)->toBe('203.0.113.7');
});

it('sends a new link and replaces the token the old one carried', function (): void {
    Notification::fake();

    [$session] = signInAndKeepToken();
    $stale     = issueVerificationToken($this->owner);

    resendVerification(csrfFor($session))
        ->assertStatus(202)
        ->assertExactJson([]);

    $row = AccountToken::query()->sole();

    expect($row->used_at)->toBeNull()
        ->and($row->token_hash)->not->toBe(hash('sha256', $stale))
        ->and($row->expires_at->timestamp - now()->timestamp)->toBeGreaterThan(3599);

    // The link that was emailed is the one that works.
    verifyEmail(rawVerificationToken())->assertOk();

    // And the owner is still signed in throughout.
    $this->getJson('/api/v1/auth/session')
        ->assertOk()
        ->assertJsonPath('user.id', $this->owner->getKey());
});

it('sends a link to an account that has no password', function (): void {
    Notification::fake();

    $google = User::factory()->create([
        'email'    => 'grace@example.com',
        'password' => null,
        'provider' => AuthIdentity::PROVIDER_GOOGLE,
    ]);

    $session = issueSessionFor($google);
    $this->withUnencryptedCookies([sessionCookieName() => queuedSessionToken()]);
    Auth::forgetGuards();

    resendVerification(csrfFor($session))->assertStatus(202);

    Notification::assertSentOnDemand(VerifyEmailNotification::class);
    expect(AccountToken::query()->sole()->user_id)->toBe($google->getKey());
});

it('sends a link even when the address is already verified', function (): void {
    Notification::fake();

    $this->owner->update(['email_verified_at' => now()]);

    [$session] = signInAndKeepToken();

    resendVerification(csrfFor($session))->assertStatus(202);

    Notification::assertSentOnDemand(VerifyEmailNotification::class);
});

it('needs a session to resend', function (): void {
    Notification::fake();

    resendVerification()
        ->assertStatus(401)
        ->assertJsonPath('error.code', 'unauthenticated');

    Notification::assertNothingSent();
    expect(AccountToken::query()->count())->toBe(0);
});

it('needs a csrf token to resend', function (): void {
    Notification::fake();

    signInAndKeepToken();

    resendVerification(null)
        ->assertStatus(403)
        ->assertJsonPath('error.code', 'csrf_failed');

    Notification::assertNothingSent();
    expect(AccountToken::query()->count())->toBe(0);
});

it('rate limits resend to 5 an hour per owner', function (): void {
    $request = Request::create('/api/v1/auth/email/resend', 'POST');
    $request->setUserResolver(fn (): User => $this->owner);

    $limit = app(RateLimiter::class)->limiter('auth.email.resend')($request);

    expect($limit->maxAttempts)->toBe(5)
        ->and($limit->decaySeconds)->toBe(3600)
        ->and($limit->key)->toBe($this->owner->getKey());
});
