<?php

use App\Models\Session;
use App\Models\User;
use Illuminate\Hashing\HashManager;
use Illuminate\Support\Facades\Hash;

function loginOwner(array $attributes = [])
{
    return test()->postJson('/api/v1/auth/login', array_merge([
        'email' => 'ada@example.com',
        'password' => 'analytical-engine',
    ], $attributes));
}

test('login exchanges valid credentials for a session cookie', function () {
    User::factory()->create([
        'email' => 'ada@example.com',
        'password' => Hash::make('analytical-engine'),
    ]);

    $response = loginOwner();

    $response->assertOk()
        ->assertJsonPath('user.email', 'ada@example.com')
        ->assertJsonPath('user.id', User::query()->sole()->id)
        ->assertJsonStructure(['user' => ['id', 'name', 'email', 'emailVerifiedAt'], 'csrfToken', 'expiresAt'])
        ->assertJsonMissingPath('user.password');

    expect($response->getCookie('sendocs_session', decrypt: false))->not->toBeNull()
        ->and(Session::query()->sole()->user_id)->toBe(User::query()->sole()->id);
});

test('login returns byte-identical 401 bodies for a wrong password and an unknown address', function () {
    User::factory()->create(['email' => 'ada@example.com', 'password' => Hash::make('correct-password')]);

    $wrongPassword = loginOwner(['password' => 'wrong-password']);
    $unknown = loginOwner(['email' => 'unknown@example.com']);

    $wrongPassword->assertStatus(401);
    $unknown->assertStatus(401);

    expect($wrongPassword->content())->toBe($unknown->content())
        ->and($wrongPassword->json('error.code'))->toBe('invalid_credentials')
        ->and($wrongPassword->getCookie('sendocs_session', decrypt: false))->toBeNull()
        ->and(Session::query()->count())->toBe(0);
});

test('login still verifies a password when the address is unknown, so timing cannot reveal it', function () {
    $hash = Mockery::spy(HashManager::class);
    $hash->shouldReceive('check')->andReturnFalse();

    test()->instance('hash', $hash);

    loginOwner(['email' => 'unknown@example.com'])->assertStatus(401);

    $hash->shouldHaveReceived('check')->once();
});

test('login does not normalize the address before the lookup', function () {
    User::factory()->create(['email' => 'ada@example.com', 'password' => Hash::make('analytical-engine')]);

    loginOwner(['email' => '  ADA@Example.COM  '])->assertStatus(401);
});

test('login fails a malformed address with a validation error', function () {
    loginOwner(['email' => 'not-an-email'])->assertStatus(422)
        ->assertJsonPath('error.code', 'validation_failed')
        ->assertJsonPath('error.details.email', 'The email field must be a valid email address.');

    expect(loginOwner(['email' => 'ada@example.com'])->json('error.details'))
        ->toBeNull();
});

test('login is rate limited to ten attempts a minute per ip', function () {
    foreach (range(1, 10) as $attempt) {
        loginOwner(['password' => 'wrong-password'])->assertStatus(401);
    }

    loginOwner(['password' => 'wrong-password'])->assertStatus(429)
        ->assertHeader('Retry-After')
        ->assertJsonPath('error.code', 'rate_limited');
});

test('login adds a session without revoking the sessions already issued', function () {
    User::factory()->create(['email' => 'ada@example.com', 'password' => Hash::make('analytical-engine')]);

    loginOwner()->assertOk();
    loginOwner()->assertOk();

    expect(Session::query()->count())->toBe(2);
});
