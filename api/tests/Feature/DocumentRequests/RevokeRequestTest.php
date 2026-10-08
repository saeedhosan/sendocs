<?php

declare(strict_types=1);

use App\Auth\Services\CsrfTokenService;
use App\Auth\Services\SessionService;
use App\Models\DocumentRequest;
use App\Models\User;
use Illuminate\Support\Carbon;

function revokeRequestFixture(User $owner): DocumentRequest
{
    $request = new DocumentRequest([
        'owner_id' => $owner->getKey(),
        'title' => 'Tax Documents',
        'token_hash' => hash('sha256', bin2hex(random_bytes(32))),
        'expires_at' => now()->addDays(14),
    ]);

    $request->save();

    $request->items()->create([
        'label' => 'Passport',
        'position' => 1,
    ]);

    return $request;
}

function revokeRequestAsOwner(User $owner, string $requestId, bool $withCsrf = true): \Illuminate\Testing\TestResponse
{
    $session = app(SessionService::class)->issue($owner);
    test()->withCredentials();
    useDevice(queuedSessionToken());

    $headers = $withCsrf
        ? ['X-CSRF-Token' => app(CsrfTokenService::class)->derive($session->getKey())]
        : [];

    return test()->postJson("/api/v1/requests/{$requestId}/revoke", [], $headers);
}

test('requires an authenticated owner and csrf token', function (): void {
    $request = revokeRequestFixture(User::factory()->create());

    test()->postJson("/api/v1/requests/{$request->getKey()}/revoke")
        ->assertStatus(401)
        ->assertJsonPath('error.code', 'unauthenticated');

    $owner = User::factory()->create();
    $session = app(SessionService::class)->issue($owner);
    test()->withCredentials();
    useDevice(queuedSessionToken());

    test()->postJson(
        "/api/v1/requests/{$request->getKey()}/revoke",
    )->assertStatus(403)->assertJsonPath('error.code', 'csrf_failed');
});

test('revokes an owned request and returns its detail', function (): void {
    $owner = User::factory()->create();
    $request = revokeRequestFixture($owner);

    $response = revokeRequestAsOwner($owner, $request->getKey());

    $response->assertOk()
        ->assertJsonPath('id', $request->getKey())
        ->assertJsonPath('title', 'Tax Documents')
        ->assertJsonPath('revokedAt', fn (mixed $value): bool => is_string($value) && $value !== '')
        ->assertJsonPath('items.0.label', 'Passport');

    $request->refresh();

    expect($request->revoked_at)->toBeInstanceOf(Carbon::class);
});

test('revocation is idempotent and preserves the original timestamp', function (): void {
    $owner = User::factory()->create();
    $request = revokeRequestFixture($owner);

    $first = revokeRequestAsOwner($owner, $request->getKey());
    $revokedAt = $first->json('revokedAt');

    expect($revokedAt)->toBeString();

    $second = revokeRequestAsOwner($owner, $request->getKey());

    $second->assertOk()->assertJsonPath('revokedAt', $revokedAt);

    $request->refresh();

    expect($request->revoked_at?->toIso8601String())->toBe($revokedAt);
});

test('does not reveal another owners request', function (): void {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $request = revokeRequestFixture($other);

    revokeRequestAsOwner($owner, $request->getKey())
        ->assertStatus(404)
        ->assertJsonPath('error.code', 'not_found');

    $request->refresh();

    expect($request->revoked_at)->toBeNull();
});

test('returns not found for an unknown request', function (): void {
    $owner = User::factory()->create();

    revokeRequestAsOwner($owner, '00000000-0000-0000-0000-000000000000')
        ->assertStatus(404)
        ->assertJsonPath('error.code', 'not_found');
});

test('can revoke an expired request because revocation is an owner action', function (): void {
    $owner = User::factory()->create();
    $request = revokeRequestFixture($owner);
    $request->expires_at = now()->subMinute();
    $request->save();

    revokeRequestAsOwner($owner, $request->getKey())
        ->assertOk()
        ->assertJsonPath('revokedAt', fn (mixed $value): bool => is_string($value) && $value !== '');

    $request->refresh();

    expect($request->revoked_at)->not->toBeNull();
});
