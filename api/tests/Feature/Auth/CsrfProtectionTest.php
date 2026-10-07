<?php

declare(strict_types=1);

use App\Auth\Middleware\VerifyCsrfToken;
use App\Models\Session;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;

beforeEach(function (): void {
    $this->withCredentials();

    User::factory()->create([
        'email'    => 'ada@example.com',
        'password' => Hash::make('analytical-engine'),
    ]);

    // The first owner-scoped route that changes state is logout, so the
    // middleware is exercised on a route registered here.
    Route::middleware(['auth:owner', VerifyCsrfToken::class])
        ->post('/test/owner-state-change', fn () => response()->json(['changed' => true]));

    $this->session   = signInFor('ada@example.com', 'analytical-engine');
    $this->csrfToken = $this->getJson('/api/v1/auth/session')->json('csrfToken');
});

/**
 * Sign in through the API and return the session it created.
 */
function signInFor(string $email, string $password): Session
{
    $response = test()->postJson('/api/v1/auth/login', [
        'email'    => $email,
        'password' => $password,
    ]);

    $response->assertOk();

    test()->withUnencryptedCookies([
        (string) config('session.owner_cookie.name') => $response->getCookie((string) config('session.owner_cookie.name'), decrypt: false)->getValue(),
    ]);

    Auth::forgetGuards();

    return Session::query()->latest('created_at')->first();
}

it('accepts a state-changing request carrying the session csrf token', function (): void {
    $this->withHeader('X-CSRF-Token', $this->csrfToken)
        ->postJson('/test/owner-state-change')
        ->assertOk()
        ->assertJsonPath('changed', true);
});

it('rejects a state-changing request with no csrf token', function (): void {
    $this->postJson('/test/owner-state-change')
        ->assertStatus(403)
        ->assertJsonPath('error.code', 'csrf_failed');
});

it('rejects a state-changing request with a forged csrf token', function (): void {
    $this->withHeader('X-CSRF-Token', str_repeat('f', 64))
        ->postJson('/test/owner-state-change')
        ->assertStatus(403)
        ->assertJsonPath('error.code', 'csrf_failed');
});

it('rejects a token that belongs to another session', function (): void {
    User::factory()->create([
        'email'    => 'grace@example.com',
        'password' => Hash::make('cobol-coffee'),
    ]);

    signInFor('grace@example.com', 'cobol-coffee');

    $this->getJson('/api/v1/auth/session')->assertOk();

    $this->withHeader('X-CSRF-Token', $this->csrfToken)
        ->postJson('/test/owner-state-change')
        ->assertStatus(403)
        ->assertJsonPath('error.code', 'csrf_failed');
});

it('lets a safe request through without a csrf token', function (): void {
    Route::middleware(['auth:owner', VerifyCsrfToken::class])
        ->get('/test/owner-read', fn () => response()->json(['read' => true]));

    $this->getJson('/test/owner-read')
        ->assertOk()
        ->assertJsonPath('read', true);
});

it('does not let a safe method through without a session', function (): void {
    Route::middleware([VerifyCsrfToken::class])
        ->get('/test/csrf-only', fn () => response()->json(['read' => true]));

    $this->withUnencryptedCookies([(string) config('session.owner_cookie.name') => 'not-a-real-token'])
        ->getJson('/test/csrf-only')
        ->assertStatus(401)
        ->assertJsonPath('error.code', 'unauthenticated');
});
