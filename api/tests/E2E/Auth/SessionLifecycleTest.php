<?php

use App\Models\User;
use Illuminate\Support\Facades\Auth;
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
 * Sign in and return the raw session cookie value, so a test can hold two
 * devices at once and switch between them with useDevice().
 */
function signInOn(string $email = 'ada@example.com', string $password = 'analytical-engine'): string
{
    $response = test()->postJson('/api/v1/auth/login', [
        'email' => $email,
        'password' => $password,
    ]);

    $response->assertOk();

    return $response->getCookie(sessionCookieName(), decrypt: false)->getValue();
}

it('signs out one device without touching the other', function (): void {
    $laptop = signInOn();
    $phone = signInOn();

    useDevice($phone);
    $phoneSession = $this->getJson('/api/v1/auth/session')->assertOk();

    useDevice($laptop);
    $laptopSession = $this->getJson('/api/v1/auth/session')->assertOk();

    // Two devices, two CSRF tokens, because the token is bound to the session.
    expect($laptopSession->json('csrfToken'))->not->toBe($phoneSession->json('csrfToken'));

    $logout = $this->postJson('/api/v1/auth/logout', [], [
        'X-CSRF-Token' => $laptopSession->json('csrfToken'),
    ]);

    $logout->assertNoContent();

    // The cookie the browser kept is now worth nothing.
    useDevice($laptop);
    $this->getJson('/api/v1/auth/session')->assertStatus(401);

    // And the other device never noticed.
    useDevice($phone);
    $this->getJson('/api/v1/auth/session')
        ->assertOk()
        ->assertJsonPath('user.id', $this->owner->getKey());
});

it('rejects a session cookie after the session is gone', function (): void {
    $token = signInOn();
    useDevice($token);

    $session = $this->getJson('/api/v1/auth/session');
    $session->assertOk();

    $this->postJson('/api/v1/auth/logout', [], [
        'X-CSRF-Token' => $session->json('csrfToken'),
    ])->assertNoContent();

    // Replaying the exact token the browser held is refused, not merely
    // forgotten: the row it points at is deleted.
    useDevice($token);
    $replay = $this->getJson('/api/v1/auth/session');
    $replay->assertStatus(401)->assertJsonPath('error.code', 'unauthenticated');

    // And the body is the one a fabricated cookie gets, so a caller cannot
    // tell a signed-out session from a session that never existed.
    useDevice(str_repeat('A', 43));
    $fabricated = $this->getJson('/api/v1/auth/session');
    $fabricated->assertStatus(401);

    expect($replay->content())->toBe($fabricated->content());
});

it('refuses a csrf token that belongs to another session', function (): void {
    $laptop = signInOn();
    $phone = signInOn();

    useDevice($laptop);
    $laptopCsrf = $this->getJson('/api/v1/auth/session')->json('csrfToken');

    // The phone is signed in and writes, but presents the laptop's token.
    useDevice($phone);

    $this->postJson('/api/v1/auth/email/resend', [], ['X-CSRF-Token' => $laptopCsrf])
        ->assertStatus(403)
        ->assertJsonPath('error.code', 'csrf_failed');

    // Its own token is accepted, so the failure was the mismatch and not the
    // endpoint.
    $this->getJson('/api/v1/auth/session')->assertOk();
});

it('expires a session at its absolute lifetime', function (): void {
    $token = signInOn();
    useDevice($token);

    $session = $this->getJson('/api/v1/auth/session');
    $session->assertOk();

    expect($session->json('expiresAt'))->toBe(now()->addDays(7)->toIso8601String());

    // Just inside the window, the session is still good.
    $this->travel(6)->days();
    useDevice($token);
    $this->getJson('/api/v1/auth/session')->assertOk();

    // Past it, the cookie is refused. There is no sliding renewal, so signing
    // in again is the only way forward.
    $this->travel(2)->days();
    useDevice($token);
    $this->getJson('/api/v1/auth/session')
        ->assertStatus(401)
        ->assertJsonPath('error.code', 'unauthenticated');

    // And signing in again works.
    $this->postJson('/api/v1/auth/login', [
        'email' => 'ada@example.com',
        'password' => 'analytical-engine',
    ])->assertOk();
});

it('hands the browser a session cookie that script cannot read', function (): void {
    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'ada@example.com',
        'password' => 'analytical-engine',
    ]);

    $response->assertOk();

    $cookie = $response->getCookie(sessionCookieName(), decrypt: false);

    // HttpOnly is what keeps a cross-site script from lifting the session.
    expect($cookie->isHttpOnly())->toBeTrue()
        // SameSite=Lax is what allows a deep link from a mail client while
        // still blocking the cross-site POST that CSRF exists to stop.
        ->and($cookie->getSameSite())->toBe('lax')
        // The path has to match the one the cookie is cleared with, or the
        // browser keeps a dead cookie.
        ->and($cookie->getPath())->toBe('/')
        // Host only: no Domain attribute widens it to sibling subdomains.
        ->and($cookie->getDomain())->toBeNull()
        ->and($cookie->getValue())->toMatch('/^[A-Za-z0-9_-]{43}$/');
});

it('refuses a caller with no session, a mangled cookie, or a fabricated one', function (): void {
    $user = $this->owner->getKey();

    // No cookie at all.
    $this->getJson('/api/v1/auth/session')
        ->assertStatus(401)
        ->assertJsonPath('error.code', 'unauthenticated');

    // Right shape, no such session.
    $this->withUnencryptedCookies([sessionCookieName() => str_repeat('A', 43)]);
    $this->getJson('/api/v1/auth/session')->assertStatus(401);

    // Not even a token shape, which is refused before any lookup.
    $this->withUnencryptedCookies([sessionCookieName() => 'not-a-token']);
    $this->getJson('/api/v1/auth/session')->assertStatus(401);

    // The guard is dropped between attempts, because one request resolves one
    // caller and a test drives several.
    Auth::forgetGuards();
    expect($user)->not->toBeEmpty();
});

it('signs an owner back in from a second browser and keeps the sessions apart', function (): void {
    $first = signInOn();

    $second = signInOn();

    expect($second)->not->toBe($first);

    useDevice($first);
    $this->getJson('/api/v1/auth/session')->assertOk();

    useDevice($second);
    $this->getJson('/api/v1/auth/session')->assertOk();
});
