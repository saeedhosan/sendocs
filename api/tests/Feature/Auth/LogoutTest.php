<?php

use App\Models\Session;
use App\Models\User;
use Illuminate\Cache\RateLimiter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

beforeEach(function (): void {
    $this->withCredentials();

    $this->owner = User::factory()->create([
        'email' => 'ada@example.com',
        'password' => Hash::make('analytical-engine'),
    ]);
});

it('returns 204 with no body and deletes the session row', function (): void {
    [$session] = signInAndKeepToken();

    $response = $this->postJson('/api/v1/auth/logout', [], ['X-CSRF-Token' => csrfFor($session)]);

    $response->assertNoContent();
    expect($response->getContent())->toBe('');

    expect(Session::query()->find($session->getKey()))->toBeNull();
});

it('makes the old cookie inert', function (): void {
    [$session, $token] = signInAndKeepToken();

    $this->postJson('/api/v1/auth/logout', [], ['X-CSRF-Token' => csrfFor($session)])->assertNoContent();

    // The same cookie, unchanged, is what the browser would send next.
    $this->withUnencryptedCookies([sessionCookieName() => $token]);
    Auth::forgetGuards();

    $this->getJson('/api/v1/auth/session')
        ->assertStatus(401)
        ->assertJsonPath('error.code', 'unauthenticated');
});

it('tells the browser to drop the cookie', function (): void {
    [$session] = signInAndKeepToken();

    $response = $this->postJson('/api/v1/auth/logout', [], ['X-CSRF-Token' => csrfFor($session)]);

    $cookie = $response->getCookie(sessionCookieName(), decrypt: false);

    expect($cookie)->not->toBeNull()
        ->and($cookie->getExpiresTime())->toBeLessThan(now()->getTimestamp())
        ->and($cookie->getPath())->toBe('/');
});

it('keeps a second device signed in', function (): void {
    [$laptop, $laptopToken] = signInAndKeepToken();
    [$phone, $phoneToken] = signInAndKeepToken();

    $this->withUnencryptedCookies([sessionCookieName() => $laptopToken]);
    Auth::forgetGuards();

    $this->postJson('/api/v1/auth/logout', [], ['X-CSRF-Token' => csrfFor($laptop)])->assertNoContent();

    expect(Session::query()->find($laptop->getKey()))->toBeNull()
        ->and(Session::query()->find($phone->getKey()))->not->toBeNull();

    $this->withUnencryptedCookies([sessionCookieName() => $phoneToken]);
    Auth::forgetGuards();

    $this->getJson('/api/v1/auth/session')
        ->assertOk()
        ->assertJsonPath('user.id', $this->owner->getKey());
});

it('rejects logout with no session cookie', function (): void {
    $this->postJson('/api/v1/auth/logout')
        ->assertStatus(401)
        ->assertJsonPath('error.code', 'unauthenticated')
        ->assertJsonPath('error.message', 'Sign in to continue.');
});

it('rejects logout without a csrf token', function (): void {
    signInAndKeepToken();

    $this->postJson('/api/v1/auth/logout')
        ->assertStatus(403)
        ->assertJsonPath('error.code', 'csrf_failed');
});

it('rejects a csrf token that belongs to another session', function (): void {
    [$session] = signInAndKeepToken();
    $foreignToken = csrfFor($session);

    // A second session for the same owner: the token from the first one is not
    // the token this cookie is checked against.
    [$other] = signInAndKeepToken();

    expect($foreignToken)->not->toBe(csrfFor($other));

    $this->postJson('/api/v1/auth/logout', [], ['X-CSRF-Token' => $foreignToken])
        ->assertStatus(403)
        ->assertJsonPath('error.code', 'csrf_failed');

    expect(Session::query()->find($other->getKey()))->not->toBeNull();
});

it('rate limits logout at 120 a minute per owner', function (): void {
    // The limiter definition is checked rather than a run of 120 real logouts:
    // the first one destroys the session that the rest would reuse, and a
    // second sign-in for fresh cookies runs into the login limit.
    $request = Request::create('/api/v1/auth/logout', 'POST');
    $request->setUserResolver(fn (): User => $this->owner);

    $limit = app(RateLimiter::class)->limiter('auth.logout')($request);

    expect($limit->maxAttempts)->toBe(120)
        ->and($limit->decaySeconds)->toBe(60)
        ->and($limit->key)->toBe($this->owner->getKey());
});

it('keys the logout limit on the owner, not the address', function (): void {
    $grace = User::factory()->create([
        'email' => 'grace@example.com',
        'password' => Hash::make('cobol-coffee'),
    ]);

    $limiter = app(RateLimiter::class)->limiter('auth.logout');

    $request = Request::create('/api/v1/auth/logout', 'POST');
    $request->setUserResolver(fn (): User => $this->owner);
    $adaKey = $limiter($request)->key;

    $request->setUserResolver(fn (): User => $grace);
    $graceKey = $limiter($request)->key;

    // Signed out there is no owner to count against, so the address is the
    // fallback rather than one shared bucket.
    $request->setUserResolver(fn (): ?User => null);

    expect($adaKey)->toBe($this->owner->getKey())
        ->and($graceKey)->toBe($grace->getKey())
        ->and($limiter($request)->key)->toBe($request->ip())
        ->and($graceKey)->not->toBe($adaKey);
});
