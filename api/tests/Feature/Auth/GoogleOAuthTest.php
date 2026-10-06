<?php

use App\Auth\Services\GoogleOAuthService;
use App\Models\AuthIdentity;
use App\Models\Session;
use App\Models\User;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Testing\TestResponse;
use Tests\Support\GoogleToken;

beforeEach(function (): void {
    config()->set('services.google.client_id', GoogleToken::CLIENT_ID);
    config()->set('services.google.client_secret', 'test-client-secret');
    config()->set('services.google.redirect_uri', 'http://localhost:3000/auth/google/callback');

    Cache::flush();
});

/**
 * Stub Google answering with an arbitrary token body.
 *
 * @param  array<string, mixed>|null  $response
 */
function fakeIdToken(?string $idToken, ?array $response = null): void
{
    Http::fake([
        'oauth2.googleapis.com/token' => Http::response($response ?? ['id_token' => $idToken]),
        'www.googleapis.com/oauth2/v3/certs' => Http::response(GoogleToken::jwks()),
    ]);
}

function googleStart(): array
{
    $response = test()->getJson('/api/v1/auth/oauth/google');

    $response->assertOk();

    parse_str((string) parse_url($response->json('authUrl'), PHP_URL_QUERY), $query);

    return $query;
}

function googleCallback(array $overrides = []): TestResponse
{
    return test()->getJson('/api/v1/auth/oauth/google/callback?'.http_build_query(array_merge([
        'code' => 'google-authorization-code',
        'state' => 'state-token',
    ], $overrides)));
}

it('returns an authorization url with the documented parameters', function (): void {
    $query = googleStart();

    expect($query['client_id'])->toBe(GoogleToken::CLIENT_ID)
        ->and($query['redirect_uri'])->toBe('http://localhost:3000/auth/google/callback')
        ->and($query['response_type'])->toBe('code')
        ->and($query['scope'])->toBe('openid email profile')
        ->and($query['code_challenge_method'])->toBe('S256')
        ->and($query['code_challenge'])->not->toBeEmpty()
        ->and($query['state'])->not->toBeEmpty();
});

it('stores the pkce verifier against the state without it appearing in the url', function (): void {
    $query = googleStart();

    $stored = Cache::get('auth.oauth.google.state.'.hash('sha256', $query['state']));

    expect($stored['verifier'])
        ->not->toBeEmpty()
        ->not->toContain($query['code_challenge'])
        ->and(hash('sha256', $stored['verifier'], true))
        ->toBe(base64_decode(strtr($query['code_challenge'], '-_', '+/').'==', false));
});

it('signs a new owner in on the first google sign-in', function (): void {
    fakeGoogle();

    $state = googleStart()['state'];

    $response = googleCallback(['state' => $state]);

    $response->assertOk()->assertJsonPath('user.email', 'owner@example.com');

    $user = User::query()->sole();

    expect($user->provider)->toBe(AuthIdentity::PROVIDER_GOOGLE)
        ->and($user->password)->toBeNull()
        ->and($user->email_verified_at)->not->toBeNull()
        ->and(AuthIdentity::query()->sole()->provider_id)->toBe('google-subject-1')
        ->and(Session::query()->sole()->user_id)->toBe($user->getKey());

    expect($response->headers->getCookies())->not->toBeEmpty();
});

it('sends the pkce verifier and client secret when exchanging the code', function (): void {
    fakeGoogle();

    $state = googleStart()['state'];

    googleCallback(['state' => $state])->assertOk();

    Http::assertSent(function ($request): bool {
        return $request->url() === 'https://oauth2.googleapis.com/token'
            && $request['code_verifier'] !== ''
            && $request['client_secret'] === 'test-client-secret'
            && $request['grant_type'] === 'authorization_code';
    });
});

it('signs an existing google identity in without creating another owner', function (): void {
    fakeGoogle();

    $existing = User::factory()->create(['email' => 'owner@example.com']);
    AuthIdentity::query()->create([
        'user_id' => $existing->getKey(),
        'provider' => AuthIdentity::PROVIDER_GOOGLE,
        'provider_id' => 'google-subject-1',
    ]);

    $state = googleStart()['state'];

    googleCallback(['state' => $state])->assertOk()->assertJsonPath('user.email', 'owner@example.com');

    expect(User::query()->count())->toBe(1)
        ->and(AuthIdentity::query()->count())->toBe(1);
});

it('refuses to link a google sign-in to an owner who registered with a password', function (): void {
    fakeGoogle();

    User::factory()->create(['email' => 'owner@example.com']);

    $state = googleStart()['state'];

    googleCallback(['state' => $state])
        ->assertStatus(409)
        ->assertJsonPath('error.code', 'oauth_provider_conflict');

    expect(AuthIdentity::query()->count())->toBe(0)
        ->and(Session::query()->count())->toBe(0);
});

it('rejects a replayed state', function (): void {
    fakeGoogle();

    $state = googleStart()['state'];

    googleCallback(['state' => $state])->assertOk();
    googleCallback(['state' => $state])
        ->assertStatus(400)
        ->assertJsonPath('error.code', 'oauth_failed');

    expect(User::query()->count())->toBe(1);
});

it('rejects a state that was never issued', function (): void {
    googleCallback()
        ->assertStatus(400)
        ->assertJsonPath('error.code', 'oauth_failed');

    Http::assertNothingSent();
});

it('rejects an expired state', function (): void {
    $state = googleStart()['state'];

    Cache::put('auth.oauth.google.state.'.hash('sha256', $state), ['verifier' => 'x'], now()->subMinute());

    googleCallback(['state' => $state])
        ->assertStatus(400)
        ->assertJsonPath('error.code', 'oauth_failed');
});

it('rejects a token signed by a key google did not publish', function (): void {
    fakeGoogle([], GoogleToken::untrustedPrivateKey());

    $state = googleStart()['state'];

    googleCallback(['state' => $state])
        ->assertStatus(400)
        ->assertJsonPath('error.code', 'oauth_failed');

    expect(User::query()->count())->toBe(0);
});

it('rejects a token that was issued for another client', function (): void {
    fakeGoogle(['aud' => 'someone-else.apps.googleusercontent.com']);

    $state = googleStart()['state'];

    googleCallback(['state' => $state])
        ->assertStatus(400)
        ->assertJsonPath('error.code', 'oauth_failed');
});

it('rejects an expired token', function (): void {
    fakeGoogle(['exp' => now()->subMinute()->getTimestamp()]);

    $state = googleStart()['state'];

    googleCallback(['state' => $state])
        ->assertStatus(400)
        ->assertJsonPath('error.code', 'oauth_failed');
});

it('rejects an unverified google email', function (): void {
    fakeGoogle(['email_verified' => false]);

    $state = googleStart()['state'];

    googleCallback(['state' => $state])
        ->assertStatus(400)
        ->assertJsonPath('error.code', 'oauth_failed');

    expect(User::query()->count())->toBe(0);
});

it('rejects a tampered token', function (): void {
    $token = GoogleToken::idToken();
    [$header, $payload] = explode('.', $token);
    $tampered = $header.'.'.rtrim(strtr(base64_encode((string) json_encode([
        'iss' => 'https://accounts.google.com',
        'aud' => GoogleToken::CLIENT_ID,
        'sub' => 'google-subject-1',
        'email' => 'attacker@example.com',
        'email_verified' => true,
        'name' => 'Attacker',
        'exp' => now()->addHour()->getTimestamp(),
    ])), '+/', '-_'), '=').'.'.explode('.', $token)[2];

    Http::fake([
        'oauth2.googleapis.com/token' => Http::response(['id_token' => $tampered]),
        'www.googleapis.com/oauth2/v3/certs' => Http::response(GoogleToken::jwks()),
    ]);

    $state = googleStart()['state'];

    googleCallback(['state' => $state])
        ->assertStatus(400)
        ->assertJsonPath('error.code', 'oauth_failed');
});

it('rejects a token that is not signed with rsa', function (): void {
    $payload = rtrim(strtr(base64_encode((string) json_encode(['sub' => 'x'])), '+/', '-_'), '=');

    fakeIdToken(rtrim(strtr(base64_encode((string) json_encode(['alg' => 'none', 'kid' => GoogleToken::KID])), '+/', '-_'), '=').'.'.$payload.'.x');

    $state = googleStart()['state'];

    googleCallback(['state' => $state])
        ->assertStatus(400)
        ->assertJsonPath('error.code', 'oauth_failed');
});

it('fails when google returns no id token', function (): void {
    fakeGoogle(response: ['error' => 'invalid_grant'], status: 400);

    $state = googleStart()['state'];

    googleCallback(['state' => $state])
        ->assertStatus(400)
        ->assertJsonPath('error.code', 'oauth_failed');
});

it('reports google sign-in as unconfigured when no client id is set', function (): void {
    config()->set('services.google.client_id', null);

    $this->getJson('/api/v1/auth/oauth/google')
        ->assertStatus(400)
        ->assertJsonPath('error.code', 'oauth_failed');
});

it('validates the callback payload', function (): void {
    $this->getJson('/api/v1/auth/oauth/google/callback')
        ->assertStatus(422)
        ->assertJsonPath('error.code', 'validation_failed')
        ->assertJsonPath('error.details.code', 'The code field is required.')
        ->assertJsonPath('error.details.state', 'The state field is required.');
});

it('fetches the published keys once and reuses them', function (): void {
    fakeGoogle();

    $first = googleStart()['state'];
    googleCallback(['state' => $first])->assertOk();

    $second = googleStart()['state'];
    googleCallback(['state' => $second])->assertOk();

    Http::assertSentCount(3);
});

it('fails the sign-in when google cannot be reached', function (): void {
    Http::fake(fn () => throw new ConnectionException('Connection timed out'));

    $state = googleStart()['state'];

    googleCallback(['state' => $state])
        ->assertStatus(400)
        ->assertJsonPath('error.code', 'oauth_failed');

    expect(User::query()->count())->toBe(0);
});

it('fails the sign-in when the published keys cannot be read', function (): void {
    Http::fake([
        'oauth2.googleapis.com/token' => Http::response(['id_token' => GoogleToken::idToken()]),
        'www.googleapis.com/oauth2/v3/certs' => Http::response('nope', 503),
    ]);

    $state = googleStart()['state'];

    googleCallback(['state' => $state])
        ->assertStatus(400)
        ->assertJsonPath('error.code', 'oauth_failed');
});

it('resolves two callbacks for one google account to a single owner', function (): void {
    fakeGoogle();

    $service = app(GoogleOAuthService::class);
    $profile = [
        'sub' => 'google-subject-1',
        'email' => 'owner@example.com',
        'name' => 'Owner',
    ];

    $first = $service->findOrCreateUser($profile);
    $second = $service->findOrCreateUser($profile);

    expect($second->getKey())->toBe($first->getKey())
        ->and(User::query()->count())->toBe(1)
        ->and(AuthIdentity::query()->count())->toBe(1);
});

it('rate limits the google flow', function (): void {
    for ($attempt = 0; $attempt < 10; $attempt++) {
        $this->getJson('/api/v1/auth/oauth/google')->assertOk();
    }

    $this->getJson('/api/v1/auth/oauth/google')
        ->assertStatus(429)
        ->assertJsonPath('error.code', 'rate_limited');
});
