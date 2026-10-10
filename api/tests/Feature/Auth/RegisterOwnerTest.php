<?php

declare(strict_types=1);

use App\Models\AccountToken;
use App\Models\Session;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

function registerOwner(array $attributes = [])
{
    return test()->postJson('/api/v1/auth/register', array_merge([
        'name'     => 'Ada Lovelace',
        'email'    => 'Ada@Example.com',
        'password' => 'analytical-engine',
    ], $attributes));
}

test('register creates the account, signs it in, and returns no password', function (): void {
    $response = registerOwner();

    $response->assertCreated()
        ->assertJsonPath('user.email', 'ada@example.com')
        ->assertJsonPath('user.name', 'Ada Lovelace')
        ->assertJsonPath('user.emailVerifiedAt', null)
        ->assertJsonMissingPath('user.password')
        ->assertJsonStructure(['user' => ['id', 'name', 'email', 'emailVerifiedAt'], 'csrfToken', 'expiresAt']);

    $user = User::query()->sole();

    expect($user->email)->toBe('ada@example.com')
        ->and($user->provider)->toBe('custom')
        ->and($user->email_verified_at)->toBeNull()
        ->and(Hash::check('analytical-engine', $user->password))->toBeTrue();
});

test('register sets an http only session cookie that expires in seven days', function (): void {
    $cookie = registerOwner()->getCookie('sendocs_session', decrypt: false);

    expect($cookie)->not->toBeNull()
        ->and($cookie->isHttpOnly())->toBeTrue()
        ->and($cookie->getSameSite())->toBe('lax')
        ->and($cookie->getPath())->toBe('/')
        ->and($cookie->getExpiresTime())->toBeGreaterThan(now()->addDays(7)->subMinutes(2)->getTimestamp())
        ->and($cookie->getExpiresTime())->toBeLessThanOrEqual(now()->addDays(7)->addMinute()->getTimestamp());

    $session = Session::query()->sole();

    expect($session->expires_at->timestamp - now()->timestamp)->toBeGreaterThanOrEqual(604799)
        ->and($session->user_id)->toBe(User::query()->sole()->id);
});

test('register stores only the hash of the session cookie', function (): void {
    $cookie = registerOwner()->getCookie('sendocs_session', decrypt: false)->getValue();

    expect($cookie)->toMatch('/^[A-Za-z0-9_-]{43}$/')
        ->and(Session::query()->sole()->token_hash)->toBe(hash('sha256', $cookie))
        ->and(Session::query()->where('token_hash', $cookie)->exists())->toBeFalse();
});

test('register returns a csrf token derived from the session id', function (): void {
    $response = registerOwner();

    expect($response->json('csrfToken'))
        ->toBe(hash_hmac('sha256', Session::query()->sole()->id, config('auth.csrf_secret')));
});

test('register issues one verification token for sixty minutes and emails its raw value', function (): void {
    Notification::fake();

    registerOwner();

    $token = AccountToken::query()->sole();

    expect($token->purpose)->toBe(AccountToken::PURPOSE_EMAIL_VERIFICATION)
        ->and($token->used_at)->toBeNull()
        ->and($token->expires_at->timestamp - now()->timestamp)->toBeGreaterThanOrEqual(3599)
        ->and($token->expires_at->timestamp - now()->timestamp)->toBeLessThanOrEqual(3600)
        ->and($token->token_hash)->toHaveLength(64);

    $mail = catchVerificationNotification()->toMail(User::query()->sole());

    expect($mail->actionUrl)->toMatch('#/verify-email\?token=[A-Za-z0-9_-]{43}$#');
});

test('register keeps the account, the session, and the token in one transaction', function (): void {
    Notification::fake();

    AccountToken::creating(fn () => throw new RuntimeException('token insert failed'));

    registerOwner()->assertStatus(500);

    expect(User::query()->count())->toBe(0)
        ->and(Session::query()->count())->toBe(0);

    Notification::assertNothingSent();
});

test('register rejects an address that is already registered, with the same body every time', function (): void {
    User::factory()->create(['email' => 'ada@example.com']);

    $first = registerOwner(['email' => 'ada@example.com']);
    $first->assertConflict();

    $second = registerOwner(['email' => 'ada@example.com']);
    $second->assertConflict();

    expect($second->content())->toBe($first->content())
        ->and($first->getCookie('sendocs_session', decrypt: false))->toBeNull()
        ->and(User::query()->count())->toBe(1);
});

test('register normalizes email and rejects a case variant of an existing address', function (): void {
    User::factory()->create(['email' => 'ada@example.com']);

    registerOwner(['email' => '  ADA@Example.COM  '])->assertConflict();

    expect(User::query()->count())->toBe(1);
});

test('register fails validation with one details entry per field', function (): void {
    $response = registerOwner(['name' => '', 'email' => 'not-an-email', 'password' => 'too-short']);

    $response->assertStatus(422)
        ->assertJsonPath('error.code', 'validation_failed')
        ->assertJsonStructure(['error' => ['code', 'message', 'details' => ['name', 'email', 'password']]]);

    expect(User::query()->count())->toBe(0)
        ->and($response->getCookie('sendocs_session', decrypt: false))->toBeNull();
});

test('register accepts a password at both ends of the published length range', function (): void {
    registerOwner(['email' => 'twelve@example.com', 'password' => 'twelvechars!'])->assertCreated();
    registerOwner(['email' => 'longest@example.com', 'password' => str_repeat('a', 200)])->assertCreated();

    registerOwner(['email' => 'longer@example.com', 'password' => str_repeat('a', 201)])->assertStatus(422);
    registerOwner(['email' => 'shorter@example.com', 'password' => 'elevenchars'])->assertStatus(422);
});

test('register is rate limited to ten attempts a minute per address', function (): void {
    foreach (range(1, 10) as $attempt) {
        registerOwner(['email' => "owner{$attempt}@example.com"])->assertCreated();
    }

    $response = registerOwner(['email' => 'eleventh@example.com']);

    $response->assertStatus(429)
        ->assertHeader('Retry-After')
        ->assertJsonPath('error.code', 'rate_limited');

    expect(User::query()->count())->toBe(10);
});

test('register takes no csrf token, because it is not an authenticated endpoint', function (): void {
    Notification::fake();

    registerOwner()->assertCreated();
});
