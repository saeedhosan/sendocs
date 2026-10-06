<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

beforeEach(function (): void {
    // A JSON test request only carries cookies when it opts in, the way a
    // browser sends them for a same-origin fetch.
    $this->withCredentials();

    $this->ada = User::factory()->create([
        'email' => 'ada@example.com',
        'password' => Hash::make('analytical-engine'),
    ]);

    $this->grace = User::factory()->create([
        'email' => 'grace@example.com',
        'password' => Hash::make('compiler-1902'),
    ]);
});

/**
 * Register an owner and return the raw session cookie they were signed in with.
 */
function registerOwnerOn(string $email, string $password): string
{
    $response = test()->postJson('/api/v1/auth/register', [
        'name' => 'Owner',
        'email' => $email,
        'password' => $password,
    ]);

    $response->assertCreated();

    return $response->getCookie(sessionCookieName(), decrypt: false)->getValue();
}

it('gives each owner a session that resolves to nobody else', function (): void {
    $adaSession = test()->postJson('/api/v1/auth/login', [
        'email' => 'ada@example.com',
        'password' => 'analytical-engine',
    ])->assertOk();

    $graceSession = test()->postJson('/api/v1/auth/login', [
        'email' => 'grace@example.com',
        'password' => 'compiler-1902',
    ])->assertOk();

    useDevice($adaSession->getCookie(sessionCookieName(), decrypt: false)->getValue());

    $ada = $this->getJson('/api/v1/auth/session');

    $ada->assertOk()
        ->assertJsonPath('user.id', $this->ada->getKey())
        ->assertJsonPath('user.email', 'ada@example.com');

    // Ada's payload carries nothing of Grace's.
    expect(json_encode($ada->json()))->not->toContain('grace@example.com');

    useDevice($graceSession->getCookie(sessionCookieName(), decrypt: false)->getValue());

    $grace = $this->getJson('/api/v1/auth/session');

    $grace->assertOk()
        ->assertJsonPath('user.id', $this->grace->getKey())
        ->assertJsonPath('user.email', 'grace@example.com');

    expect(json_encode($grace->json()))->not->toContain('ada@example.com');
});

it('verifies only the account the emailed link was issued for', function (): void {
    Notification::fake();

    registerOwnerOn('lovelace@example.com', 'analytical-engine');
    $token = rawVerificationToken();

    registerOwnerOn('hopper@example.com', 'compiler-1902');

    // The first link does not reach across, even though both accounts exist and
    // both are unverified.
    $this->getJson('/api/v1/auth/email/verify?token='.$token)->assertOk();

    expect(User::query()->where('email', 'lovelace@example.com')->sole()->email_verified_at)->not->toBeNull()
        ->and(User::query()->where('email', 'hopper@example.com')->sole()->email_verified_at)->toBeNull();
});

it('leaves the other owner untouched when one account is deleted', function (): void {
    $graceSession = test()->postJson('/api/v1/auth/login', [
        'email' => 'grace@example.com',
        'password' => 'compiler-1902',
    ])->assertOk();

    $adaSession = test()->postJson('/api/v1/auth/login', [
        'email' => 'ada@example.com',
        'password' => 'analytical-engine',
    ])->assertOk();

    useDevice($adaSession->getCookie(sessionCookieName(), decrypt: false)->getValue());
    $csrf = $this->getJson('/api/v1/auth/session')->json('csrfToken');

    $this->deleteJson('/api/v1/auth/account', [
        'password' => 'analytical-engine',
        'confirm' => 'ada@example.com',
    ], ['X-CSRF-Token' => $csrf])->assertNoContent();

    expect(User::query()->count())->toBe(1)
        ->and($this->grace->fresh())->not->toBeNull();

    // Grace is still signed in on the session she had, and can still manage
    // her own account.
    useDevice($graceSession->getCookie(sessionCookieName(), decrypt: false)->getValue());

    $session = $this->getJson('/api/v1/auth/session');

    $session->assertOk()->assertJsonPath('user.email', 'grace@example.com');

    $this->postJson('/api/v1/auth/password/change', [
        'currentPassword' => 'compiler-1902',
        'password' => 'cobol-refusal',
    ], ['X-CSRF-Token' => $session->json('csrfToken')])->assertNoContent();
});

it('keeps one owner signed out without signing the other out', function (): void {
    $adaSession = test()->postJson('/api/v1/auth/login', [
        'email' => 'ada@example.com',
        'password' => 'analytical-engine',
    ])->assertOk();

    $graceSession = test()->postJson('/api/v1/auth/login', [
        'email' => 'grace@example.com',
        'password' => 'compiler-1902',
    ])->assertOk();

    useDevice($adaSession->getCookie(sessionCookieName(), decrypt: false)->getValue());
    $csrf = $this->getJson('/api/v1/auth/session')->json('csrfToken');

    $this->postJson('/api/v1/auth/password/change', [
        'currentPassword' => 'analytical-engine',
        'password' => 'difference-engine',
    ], ['X-CSRF-Token' => $csrf])->assertNoContent();

    // Ada's change signed out Ada's other devices and nothing of Grace's.
    useDevice($graceSession->getCookie(sessionCookieName(), decrypt: false)->getValue());
    $this->getJson('/api/v1/auth/session')
        ->assertOk()
        ->assertJsonPath('user.email', 'grace@example.com');

    expect(Hash::check('compiler-1902', $this->grace->fresh()->password))->toBeTrue();
});

it('refuses to register an address that another owner already holds', function (): void {
    Notification::fake();

    $this->postJson('/api/v1/auth/register', [
        'name' => 'Impostor',
        'email' => 'ada@example.com',
        'password' => 'analytical-engine',
    ])
        ->assertStatus(409)
        ->assertJsonPath('error.code', 'email_taken');

    // Nothing was created and no mail went out.
    expect(User::query()->count())->toBe(2);

    Notification::assertNothingSent();
});
