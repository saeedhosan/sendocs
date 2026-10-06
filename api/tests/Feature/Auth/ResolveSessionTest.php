<?php

use App\Auth\Services\CsrfTokenService;
use App\Models\Session;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

beforeEach(function (): void {
    // A JSON test request only carries cookies when it opts in, the way a
    // browser sends them for a same-origin fetch.
    $this->withCredentials();

    $this->owner = User::factory()->create([
        'email' => 'ada@example.com',
        'password' => Hash::make('analytical-engine'),
    ]);
});

/**
 * Sign in through the API and send the cookie on later requests.
 *
 * The cookie is unencrypted by design: the stored value is a hash of the raw
 * token the caller must present, so the test sends it the same way a browser
 * would.
 */
function signIn(string $email = 'ada@example.com', string $password = 'analytical-engine'): Session
{
    $response = test()->postJson('/api/v1/auth/login', [
        'email' => $email,
        'password' => $password,
    ]);

    $response->assertOk();

    test()->withUnencryptedCookies([
        (string) config('session.owner_cookie.name') => $response->getCookie((string) config('session.owner_cookie.name'), decrypt: false)->getValue(),
    ]);

    // A guard caches the caller for the life of the application instance, which
    // is a single request under php-fpm. A test drives several requests through
    // one instance, so the cache is dropped before the next one.
    Auth::forgetGuards();

    return Session::query()->latest('created_at')->first();
}

it('resolves the caller, csrf token, and expiry', function (): void {
    $session = signIn();

    $response = $this->getJson('/api/v1/auth/session');

    $response->assertOk()
        ->assertJsonPath('user.id', $this->owner->getKey())
        ->assertJsonPath('user.email', 'ada@example.com')
        ->assertJsonStructure(['user' => ['id', 'name', 'email', 'emailVerifiedAt'], 'csrfToken', 'expiresAt']);

    expect($response->json('csrfToken'))->toBe(app(CsrfTokenService::class)->derive($session->getKey()))
        ->and($response->json('expiresAt'))->toBe($session->expires_at->toIso8601String());
});

it('does not expose the session row or its token hash', function (): void {
    $session = signIn();

    $this->getJson('/api/v1/auth/session')
        ->assertOk()
        ->assertJsonMissingPath('session')
        ->assertJsonMissing(['token_hash' => $session->token_hash]);
});

it('derives the same csrf token on every call', function (): void {
    $session = signIn();

    $first = $this->getJson('/api/v1/auth/session')->json('csrfToken');
    $second = $this->getJson('/api/v1/auth/session')->json('csrfToken');

    expect($first)->toBe($second)
        ->and(app(CsrfTokenService::class)->verify($session->getKey(), $first))->toBeTrue();
});

it('rejects a request with no session cookie', function (): void {
    $this->getJson('/api/v1/auth/session')
        ->assertStatus(401)
        ->assertJsonPath('error.code', 'unauthenticated')
        ->assertJsonPath('error.message', 'Sign in to continue.');
});

it('rejects a cookie that cannot be a token without reading the sessions table', function (): void {
    $this->withUnencryptedCookies([(string) config('session.owner_cookie.name') => 'not-a-real-token']);

    DB::enableQueryLog();

    $this->getJson('/api/v1/auth/session')->assertStatus(401);

    expect(sessionQueries())->toBeEmpty();
});

it('rejects an unknown session cookie', function (): void {
    $this->withUnencryptedCookies([(string) config('session.owner_cookie.name') => str_repeat('a', 43)]);

    $this->getJson('/api/v1/auth/session')
        ->assertStatus(401)
        ->assertJsonPath('error.code', 'unauthenticated');
});

it('deletes an expired session and reports the caller as signed out', function (): void {
    $session = signIn();
    $session->update(['expires_at' => now()->subMinute()]);

    $this->getJson('/api/v1/auth/session')
        ->assertStatus(401)
        ->assertJsonPath('error.code', 'unauthenticated');

    expect(Session::query()->find($session->getKey()))->toBeNull();
});

it('reads the sessions table once per request', function (): void {
    signIn();

    DB::enableQueryLog();

    $this->getJson('/api/v1/auth/session')->assertOk();

    expect(sessionQueries())->toHaveCount(1);
});

it('keeps a second device signed in when the first one is resolved', function (): void {
    signIn('ada@example.com');
    signIn('ada@example.com');

    expect(Session::query()->count())->toBe(2);

    $this->getJson('/api/v1/auth/session')->assertOk();
});

it('rate limits session resolution per owner', function (): void {
    signIn();

    for ($attempt = 0; $attempt < 120; $attempt++) {
        $this->getJson('/api/v1/auth/session')->assertOk();
    }

    $this->getJson('/api/v1/auth/session')
        ->assertStatus(429)
        ->assertJsonPath('error.code', 'rate_limited');
});

it('keeps one owner over the limit from spending another owner allowance', function (): void {
    User::factory()->create([
        'email' => 'grace@example.com',
        'password' => Hash::make('cobol-coffee'),
    ]);

    signIn();

    for ($attempt = 0; $attempt < 120; $attempt++) {
        $this->getJson('/api/v1/auth/session')->assertOk();
    }

    $this->getJson('/api/v1/auth/session')->assertStatus(429);

    signIn('grace@example.com', 'cobol-coffee');

    $this->getJson('/api/v1/auth/session')->assertOk();
});

/**
 * The sessions queries recorded since the query log was enabled.
 *
 * @return array<int, array<string, mixed>>
 */
function sessionQueries(): array
{
    return array_values(array_filter(
        DB::getQueryLog(),
        fn (array $query): bool => str_contains($query['query'], '"sessions"'),
    ));
}
