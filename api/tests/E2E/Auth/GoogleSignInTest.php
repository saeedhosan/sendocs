<?php

use App\Models\AuthIdentity;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Testing\TestResponse;
use Tests\Support\GoogleToken;

beforeEach(function (): void {
    // A JSON test request only carries cookies when it opts in, the way a
    // browser sends them for a same-origin fetch.
    $this->withCredentials();

    config()->set('services.google.client_id', GoogleToken::CLIENT_ID);
    config()->set('services.google.client_secret', 'test-client-secret');
    config()->set('services.google.redirect_uri', 'http://localhost:3000/auth/google/callback');

    Cache::flush();
});

/**
 * Walk the redirect half of the flow and return the callback response, so a
 * test follows the same state the browser would have been handed.
 */
function followGoogleRedirect(): TestResponse
{
    $start = test()->getJson('/api/v1/auth/oauth/google');

    $start->assertOk();

    parse_str((string) parse_url($start->json('authUrl'), PHP_URL_QUERY), $query);

    // The state comes from the start response rather than a fixture, so the
    // callback is consuming a state that was really issued.
    return test()->getJson('/api/v1/auth/oauth/google/callback?'.http_build_query([
        'code' => 'google-authorization-code',
        'state' => $query['state'],
    ]));
}

it('signs an owner in with Google and confirms the address at the same time', function (): void {
    fakeGoogle();

    $callback = followGoogleRedirect();

    $callback->assertOk()
        ->assertJsonPath('user.email', 'owner@example.com')
        // Google confirmed the address, so the owner never verifies it by mail.
        ->assertJsonStructure(['user' => ['emailVerifiedAt'], 'csrfToken', 'expiresAt']);

    expect($callback->json('user.emailVerifiedAt'))->not->toBeNull();

    $owner = User::query()->sole();

    expect($owner->provider)->toBe(AuthIdentity::PROVIDER_GOOGLE)
        ->and($owner->password)->toBeNull()
        ->and(AuthIdentity::query()->sole()->provider_id)->toBe('google-subject-1');

    // The session is a normal owner session, usable for the API.
    keepCookiesFrom($callback);

    $this->getJson('/api/v1/auth/session')
        ->assertOk()
        ->assertJsonPath('user.id', $owner->getKey())
        ->assertJsonPath('user.email', 'owner@example.com');
});

it('signs the same Google owner in again after signing out', function (): void {
    fakeGoogle();

    $first = followGoogleRedirect();
    $first->assertOk();

    keepCookiesFrom($first);

    $session = $this->getJson('/api/v1/auth/session');
    $session->assertOk();

    $this->postJson('/api/v1/auth/logout', [], [
        'X-CSRF-Token' => $session->json('csrfToken'),
    ])->assertNoContent();

    $this->getJson('/api/v1/auth/session')->assertStatus(401);

    // Coming back through Google finds the identity that was linked the first
    // time, rather than making a second account for the same person.
    $second = followGoogleRedirect();

    $second->assertOk()->assertJsonPath('user.id', $first->json('user.id'));

    expect(User::query()->count())->toBe(1)
        ->and(AuthIdentity::query()->count())->toBe(1);

    keepCookiesFrom($second);
    $this->getJson('/api/v1/auth/session')->assertOk();
});

it('refuses a callback whose state was already spent', function (): void {
    fakeGoogle();

    $start = $this->getJson('/api/v1/auth/oauth/google');

    $start->assertOk();

    parse_str((string) parse_url($start->json('authUrl'), PHP_URL_QUERY), $query);

    $callback = 'api/v1/auth/oauth/google/callback?'.http_build_query([
        'code' => 'google-authorization-code',
        'state' => $query['state'],
    ]);

    $this->getJson($callback)->assertOk();

    // The same redirect replayed is a failed sign-in, not a second sign-in.
    $replay = $this->getJson($callback);

    $replay->assertStatus(400)->assertJsonPath('error.code', 'oauth_failed');

    expect(User::query()->count())->toBe(1);
});
