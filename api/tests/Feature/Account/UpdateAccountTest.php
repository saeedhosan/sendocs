<?php

declare(strict_types=1);

use App\Auth\Services\CsrfTokenService;
use App\Models\AuthIdentity;
use App\Models\Session;
use App\Models\User;
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
 * Sign in an account owner and prepare the browser cookie.
 */
function signInAccountOwner(): Session
{
    $response = test()->postJson('/api/v1/auth/login', [
        'email'    => 'ada@example.com',
        'password' => 'analytical-engine',
    ]);

    $response->assertOk();

    test()->withUnencryptedCookies([
        (string) config('session.owner_cookie.name') => $response
            ->getCookie((string) config('session.owner_cookie.name'), decrypt: false)
            ->getValue(),
    ]);

    Auth::forgetGuards();

    return Session::query()->latest('created_at')->firstOrFail();
}

it('allows an authenticated owner to update their display name', function (): void {
    $session = signInAccountOwner();
    $csrf    = app(CsrfTokenService::class)->derive($session->getKey());

    $this->withHeader('X-CSRF-Token', $csrf)
        ->patchJson('/api/v1/account', ['name' => '  Ada Lovelace  '])
        ->assertOk()
        ->assertJsonPath('user.name', 'Ada Lovelace')
        ->assertJsonPath('user.email', 'ada@example.com')
        ->assertJsonPath('user.pictureUrl', null)
        ->assertJsonPath('csrfToken', $csrf);

    expect($this->owner->fresh()->name)->toBe('Ada Lovelace');
});

it('does not change linked provider identity data when the display name changes', function (): void {
    AuthIdentity::query()->create([
        'user_id'     => $this->owner->getKey(),
        'provider'    => AuthIdentity::PROVIDER_GOOGLE,
        'provider_id' => 'google-subject-1',
    ]);

    $session = signInAccountOwner();
    $csrf    = app(CsrfTokenService::class)->derive($session->getKey());

    $this->withHeader('X-CSRF-Token', $csrf)
        ->patchJson('/api/v1/account', ['name' => 'Ada Byron'])
        ->assertOk();

    expect(AuthIdentity::query()->sole()->provider_id)->toBe('google-subject-1')
        ->and($this->owner->fresh()->name)->toBe('Ada Byron');
});

it('ignores client-supplied profile picture URLs', function (): void {
    $session = signInAccountOwner();
    $csrf    = app(CsrfTokenService::class)->derive($session->getKey());

    $this->withHeader('X-CSRF-Token', $csrf)
        ->patchJson('/api/v1/account', [
            'name'       => 'Ada Lovelace',
            'pictureUrl' => 'https://attacker.example/image.png',
        ])
        ->assertOk()
        ->assertJsonPath('user.pictureUrl', null);
});

it('cannot update another owner by submitting their user id', function (): void {
    $other   = User::factory()->create(['name' => 'Grace Hopper']);
    $session = signInAccountOwner();
    $csrf    = app(CsrfTokenService::class)->derive($session->getKey());

    $this->withHeader('X-CSRF-Token', $csrf)
        ->patchJson('/api/v1/account', [
            'name'    => 'Ada Lovelace',
            'user_id' => $other->getKey(),
        ])
        ->assertOk();

    expect($this->owner->fresh()->name)->toBe('Ada Lovelace')
        ->and($other->fresh()->name)->toBe('Grace Hopper');
});

it('rejects blank and oversized display names', function (array $payload): void {
    $session = signInAccountOwner();
    $csrf    = app(CsrfTokenService::class)->derive($session->getKey());

    $this->withHeader('X-CSRF-Token', $csrf)
        ->patchJson('/api/v1/account', $payload)
        ->assertStatus(422)
        ->assertJsonPath('error.code', 'validation_failed');
})->with([
    'blank after trimming' => [['name' => '   ']],
    'too long'             => [['name' => str_repeat('a', 121)]],
]);

it('requires a valid owner session', function (): void {
    $this->patchJson('/api/v1/account', ['name' => 'Ada Lovelace'])
        ->assertUnauthorized()
        ->assertJsonPath('error.code', 'unauthenticated');
});

it('requires a valid csrf token', function (): void {
    signInAccountOwner();

    $this->patchJson('/api/v1/account', ['name' => 'Ada Lovelace'])
        ->assertForbidden()
        ->assertJsonPath('error.code', 'csrf_failed');

    $this->withHeader('X-CSRF-Token', 'invalid-token')
        ->patchJson('/api/v1/account', ['name' => 'Ada Lovelace'])
        ->assertForbidden()
        ->assertJsonPath('error.code', 'csrf_failed');
});

it('rate limits account updates per owner', function (): void {
    $session = signInAccountOwner();
    $csrf    = app(CsrfTokenService::class)->derive($session->getKey());

    $this->withHeader('X-CSRF-Token', $csrf);

    for ($attempt = 0; $attempt < 30; $attempt++) {
        $this->patchJson('/api/v1/account', ['name' => 'Ada Lovelace'])->assertOk();
    }

    $this->patchJson('/api/v1/account', ['name' => 'Ada Lovelace'])
        ->assertStatus(429)
        ->assertJsonPath('error.code', 'rate_limited');
});
