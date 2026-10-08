<?php

declare(strict_types=1);

use App\Models\DocumentRequest;
use App\Models\User;
use Illuminate\Testing\TestResponse;

function portalRequestFixture(User $owner, ?string $token = null): array
{
    $token ??= rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');

    $request = new DocumentRequest([
        'owner_id' => $owner->getKey(),
        'title' => 'Tax Documents',
        'token_hash' => hash('sha256', $token),
        'expires_at' => now()->addDays(14),
    ]);

    $request->save();

    $request->items()->createMany([
        ['label' => 'Passport', 'position' => 1],
        ['label' => 'Bank Statement', 'position' => 2],
    ]);

    return [$request, $token];
}

function getPortal(string $token): TestResponse
{
    return test()->getJson("/api/v1/portal/{$token}");
}

test('returns the portal view for a valid token', function (): void {
    [$request, $token] = portalRequestFixture(User::factory()->create());

    getPortal($token)
        ->assertOk()
        ->assertJsonPath('title', 'Tax Documents')
        ->assertJsonPath('status', 'waiting')
        ->assertJsonPath('uploaded', 0)
        ->assertJsonPath('total', 2)
        ->assertJsonPath('items.0.label', 'Passport')
        ->assertJsonPath('items.0.state', 'waiting')
        ->assertJsonPath('items.0.file', null)
        ->assertJsonPath('items.1.label', 'Bank Statement')
        ->assertJsonMissingPath('id')
        ->assertJsonMissingPath('items.0.document')
        ->assertJsonMissingPath('items.0.mimeType')
        ->assertJsonMissingPath('items.0.downloadUrl');

    expect($request->token_hash)->toHaveLength(64);
});

test('returns the same 410 error for malformed unknown expired and revoked tokens', function (): void {
    [$request, $token] = portalRequestFixture(User::factory()->create());

    $valid = getPortal($token);
    $malformed = getPortal('not-a-valid-token');
    $unknown = getPortal(rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '='));

    $request->expires_at = now()->subMinute();
    $request->save();
    $expired = getPortal($token);

    $request->expires_at = now()->addDays(14);
    $request->revoked_at = now();
    $request->save();
    $revoked = getPortal($token);

    foreach ([$malformed, $unknown, $expired, $revoked] as $response) {
        $response
            ->assertStatus(410)
            ->assertExactJson([
                'error' => [
                    'code' => 'invalid_link',
                    'message' => 'This link is no longer valid.',
                ],
            ]);
    }

    $valid->assertOk();
});

test('does not set a session cookie on the portal', function (): void {
    [, $token] = portalRequestFixture(User::factory()->create());

    getPortal($token)->assertOk()->assertCookieMissing(config('session.owner_cookie.name'));
});

test('does not expose owner data or credential material', function (): void {
    [$request, $token] = portalRequestFixture(User::factory()->create());

    getPortal($token)
        ->assertOk()
        ->assertJsonMissingPath('ownerId')
        ->assertJsonMissingPath('tokenHash')
        ->assertJsonMissingPath('token')
        ->assertJsonMissingPath('owner')
        ->assertJsonMissingPath('items.0.storageKey');

    expect($request->token_hash)->not->toBe($token);
});

test('rate limits portal reads per ip', function (): void {
    [, $token] = portalRequestFixture(User::factory()->create());

    for ($i = 0; $i < 60; $i++) {
        getPortal($token)->assertOk();
    }

    getPortal($token)
        ->assertStatus(429)
        ->assertJsonPath('error.code', 'rate_limited');
});
