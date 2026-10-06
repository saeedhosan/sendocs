<?php

use App\Auth\Notifications\ResetPasswordNotification;
use App\Auth\Services\AccountTokenService;
use App\Models\AccountToken;
use App\Models\AuthIdentity;
use App\Models\Session;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

beforeEach(function (): void {
    Notification::fake();

    $this->owner = User::factory()->create([
        'email' => 'ada@example.com',
        'password' => Hash::make('analytical-engine'),
    ]);
});

/**
 * Ask for a reset link and return the raw token the email carries.
 */
function requestResetToken(User $user): string
{
    test()->postJson('/api/v1/auth/password/forgot', ['email' => $user->email])->assertStatus(202);

    $notification = null;

    Notification::assertSentOnDemand(
        ResetPasswordNotification::class,
        function (ResetPasswordNotification $sent) use (&$notification): bool {
            $notification = $sent;

            return true;
        },
    );

    return str($notification->toMail($notification)->actionUrl)->after('/reset-password?token=')->toString();
}

function resetPassword(string $token, string $password = 'difference-engine')
{
    return test()->postJson('/api/v1/auth/password/reset', [
        'token' => $token,
        'password' => $password,
    ]);
}

it('sets the new password and signs the owner in', function (): void {
    $token = requestResetToken($this->owner);

    $response = resetPassword($token);

    $response->assertOk()
        ->assertJsonPath('user.email', 'ada@example.com')
        ->assertJsonStructure(['user' => ['id', 'name', 'email', 'emailVerifiedAt'], 'csrfToken', 'expiresAt']);

    expect(Hash::check('difference-engine', $this->owner->fresh()->password))->toBeTrue()
        ->and(Hash::check('analytical-engine', $this->owner->fresh()->password))->toBeFalse();

    // The session is real: the cookie it set resolves the owner.
    $cookie = $response->getCookie((string) config('session.owner_cookie.name'), decrypt: false);

    expect($cookie)->not->toBeNull()
        ->and(Session::query()->sole()->user_id)->toBe($this->owner->getKey());
});

it('marks the token used', function (): void {
    $token = requestResetToken($this->owner);
    $row = AccountToken::query()->sole();

    expect($row->used_at)->toBeNull();

    resetPassword($token)->assertOk();

    expect($row->fresh()->used_at)->not->toBeNull();
});

it('rejects a replayed token with the same 410 as an unknown one', function (): void {
    $token = requestResetToken($this->owner);

    resetPassword($token)->assertOk();

    $replay = resetPassword($token);
    $unknown = resetPassword(str_repeat('a', 43));

    $replay->assertStatus(410)
        ->assertJsonPath('error.code', 'invalid_token')
        ->assertJsonPath('error.message', 'This link has expired or has already been used.');

    expect($unknown->content())->toBe($replay->content());
});

it('rejects an expired token', function (): void {
    $token = requestResetToken($this->owner);

    AccountToken::query()->sole()->update(['expires_at' => now()->subSecond()]);

    resetPassword($token)
        ->assertStatus(410)
        ->assertJsonPath('error.code', 'invalid_token');

    expect(Hash::check('analytical-engine', $this->owner->fresh()->password))->toBeTrue();
});

it('revokes every other session and keeps the new one', function (): void {
    $token = requestResetToken($this->owner);

    // A session from before the reset, on another device.
    $stale = Session::query()->create([
        'user_id' => $this->owner->getKey(),
        'token_hash' => hash('sha256', 'stale-device-token'),
        'expires_at' => now()->addDays(7),
    ]);

    resetPassword($token)->assertOk();

    expect(Session::query()->count())->toBe(1)
        ->and(Session::query()->sole()->getKey())->not->toBe($stale->getKey());
});

it('refuses an account with no password and leaves the token alone', function (): void {
    $google = User::factory()->create([
        'email' => 'grace@example.com',
        'password' => null,
        'provider' => AuthIdentity::PROVIDER_GOOGLE,
    ]);

    // A token that exists even though recovery never issues one for such an
    // account, so the refusal is proven rather than assumed unreachable.
    $token = app(AccountTokenService::class)->issue($google, AccountToken::PURPOSE_PASSWORD_RESET);

    $response = resetPassword($token);

    $response->assertStatus(400)
        ->assertJsonPath('error.code', 'password_not_supported')
        ->assertJsonPath('error.message', 'Password operations are not available for this account.');

    expect(AccountToken::query()->sole()->used_at)->toBeNull()
        ->and($google->fresh()->password)->toBeNull();
});

it('rejects a token issued for another purpose', function (): void {
    $token = app(AccountTokenService::class)->issue($this->owner, AccountToken::PURPOSE_EMAIL_VERIFICATION);

    resetPassword($token)
        ->assertStatus(410)
        ->assertJsonPath('error.code', 'invalid_token');
});

it('validates the payload', function (): void {
    resetPassword('')
        ->assertStatus(422)
        ->assertJsonStructure(['error' => ['details' => ['token']]]);

    resetPassword(str_repeat('a', 43), 'short')
        ->assertStatus(422)
        ->assertJsonStructure(['error' => ['details' => ['password']]]);

    resetPassword(str_repeat('a', 43), str_repeat('a', 201))
        ->assertStatus(422)
        ->assertJsonStructure(['error' => ['details' => ['password']]]);

    expect(Session::query()->count())->toBe(0);
});

it('rate limits redemption to five an hour per address', function (): void {
    $token = requestResetToken($this->owner);

    // The first redemption is the one that succeeds; the rest are replays, and
    // the sixth request is over the ceiling.
    resetPassword($token)->assertOk();

    for ($attempt = 0; $attempt < 4; $attempt++) {
        resetPassword($token)->assertStatus(410);
    }

    resetPassword($token)
        ->assertStatus(429)
        ->assertJsonPath('error.code', 'rate_limited');
});

it('leaves the owner signed out when redemption fails', function (): void {
    resetPassword(str_repeat('a', 43))->assertStatus(410);

    expect(Session::query()->count())->toBe(0)
        ->and(AccountToken::query()->count())->toBe(0);
});

it('spends a token once, decided by the conditional update alone', function (): void {
    requestResetToken($this->owner);

    $accountTokens = app(AccountTokenService::class);

    // Re-read after every step: claim() writes through the query builder, so an
    // instance held across a claim still carries the old attribute values.
    $fresh = fn (): AccountToken => AccountToken::query()->sole();

    expect($accountTokens->claim($fresh()))->toBeTrue()
        ->and($accountTokens->claim($fresh()))->toBeFalse();

    // A live, unclaimed row can still be spent, so the refusal above is the
    // used_at condition rather than a row that was never live.
    $fresh()->update(['used_at' => null]);

    expect($fresh()->used_at)->toBeNull()
        ->and($accountTokens->claim($fresh()))->toBeTrue();

    $fresh()->update(['used_at' => null, 'expires_at' => now()->subSecond()]);

    expect($accountTokens->claim($fresh()))->toBeFalse();
});

it('reports an expired, spent, or misdirected token as missing', function (): void {
    $reset = requestResetToken($this->owner);
    $verification = app(AccountTokenService::class)->issue($this->owner, AccountToken::PURPOSE_EMAIL_VERIFICATION);

    $find = fn (string $token, string $purpose) => app(AccountTokenService::class)->find($token, $purpose);

    expect($find(str_repeat('b', 43), AccountToken::PURPOSE_PASSWORD_RESET))->toBeNull()
        ->and($find($verification, AccountToken::PURPOSE_PASSWORD_RESET))->toBeNull()
        ->and($find($verification, AccountToken::PURPOSE_EMAIL_VERIFICATION))->not->toBeNull();

    AccountToken::query()->where('purpose', AccountToken::PURPOSE_PASSWORD_RESET)->sole()
        ->update(['expires_at' => now()->subSecond()]);

    expect($find($reset, AccountToken::PURPOSE_PASSWORD_RESET))->toBeNull();
});
