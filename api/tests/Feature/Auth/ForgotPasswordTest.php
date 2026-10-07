<?php

declare(strict_types=1);

use App\Auth\Notifications\ResetPasswordNotification;
use App\Auth\Services\SecureToken;
use App\Models\AccountToken;
use App\Models\AuthIdentity;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

beforeEach(function (): void {
    Notification::fake();

    $this->owner = User::factory()->create([
        'email'    => 'ada@example.com',
        'password' => Hash::make('analytical-engine'),
    ]);
});

/**
 * The token the queued email would carry, taken from the link it renders.
 *
 * The raw value exists only inside the notification, so this is the only place
 * a test can read it, and the assertion that follows is what proves the emailed
 * token is the one that was stored.
 */
function catchResetNotification(): ResetPasswordNotification
{
    $notification = null;

    Notification::assertSentOnDemand(
        ResetPasswordNotification::class,
        function (ResetPasswordNotification $sent) use (&$notification): bool {
            $notification = $sent;

            return true;
        },
    );

    return $notification;
}

/**
 * The token the queued email carries, read back out of the link it renders.
 *
 * The raw value exists only inside the notification, so this is the only place
 * a test can read it, and matching it against the stored hash is what proves the
 * emailed token is the one that was issued.
 */
function emailedResetToken(ResetPasswordNotification $notification): string
{
    $url = $notification->toMail($notification)->actionUrl;

    expect($url)->toContain('/reset-password?token=');

    return str($url)->after('/reset-password?token=')->toString();
}

it('queues a reset email for an address on file', function (): void {
    $this->postJson('/api/v1/auth/password/forgot', ['email' => 'ada@example.com'])
        ->assertStatus(202);

    $row = AccountToken::query()
        ->where('purpose', AccountToken::PURPOSE_PASSWORD_RESET)
        ->sole();

    expect($row->user_id)->toBe($this->owner->getKey())
        ->and($row->used_at)->toBeNull()
        ->and($row->expires_at->between(now()->addMinutes(59), now()->addMinutes(61)))->toBeTrue()
        ->and($row->token_hash)->toBe(SecureToken::hash(emailedResetToken(catchResetNotification())));
});

it('answers an unknown address with the same body as a known one', function (): void {
    $known   = $this->postJson('/api/v1/auth/password/forgot', ['email' => 'ada@example.com']);
    $unknown = $this->postJson('/api/v1/auth/password/forgot', ['email' => 'nobody@example.com']);

    $known->assertStatus(202);
    $unknown->assertStatus(202);

    expect($unknown->content())->toBe($known->content())
        ->and(AccountToken::query()->count())->toBe(1);
});

it('sends nothing to an account with no password', function (): void {
    $google = User::factory()->create([
        'email'    => 'grace@example.com',
        'password' => null,
        'provider' => AuthIdentity::PROVIDER_GOOGLE,
    ]);

    AuthIdentity::query()->create([
        'user_id'          => $google->getKey(),
        'provider'         => AuthIdentity::PROVIDER_GOOGLE,
        'provider_user_id' => '108765432109876543210',
    ]);

    $response = $this->postJson('/api/v1/auth/password/forgot', ['email' => 'grace@example.com']);

    $response->assertStatus(202);

    Notification::assertNothingSent();

    expect($response->content())
        ->toBe($this->postJson('/api/v1/auth/password/forgot', ['email' => 'nobody@example.com'])->content());
});

it('supersedes an earlier reset token', function (): void {
    $this->postJson('/api/v1/auth/password/forgot', ['email' => 'ada@example.com'])->assertStatus(202);
    $first = AccountToken::query()->sole();

    $this->postJson('/api/v1/auth/password/forgot', ['email' => 'ada@example.com'])->assertStatus(202);

    // The first row is gone, not the second: the newest link is the only one
    // that can be redeemed.
    expect(AccountToken::query()->count())->toBe(1)
        ->and(AccountToken::query()->sole()->getKey())->not->toBe($first->getKey());
});

it('does not normalize the address before lookup', function (): void {
    $this->postJson('/api/v1/auth/password/forgot', ['email' => '  ADA@Example.com  '])
        ->assertStatus(202);

    Notification::assertNothingSent();

    expect(AccountToken::query()->count())->toBe(0);
});

it('rejects a missing, malformed, or oversized address', function (): void {
    $this->postJson('/api/v1/auth/password/forgot', [])
        ->assertStatus(422)
        ->assertJsonPath('error.code', 'validation_failed')
        ->assertJsonStructure(['error' => ['details' => ['email']]]);

    $malformed = $this->postJson('/api/v1/auth/password/forgot', ['email' => 'not-an-address']);
    $malformed->assertStatus(422);

    $oversized = $this->postJson('/api/v1/auth/password/forgot', ['email' => str_repeat('a', 250).'@example.com']);
    $oversized->assertStatus(422);

    expect($malformed->json('error.details.email'))->toBeString()
        ->and($oversized->json('error.details.email'))->toBeString();

    Notification::assertNothingSent();
});

it('rate limits recovery to five an hour per address', function (): void {
    for ($attempt = 0; $attempt < 5; $attempt++) {
        $this->postJson('/api/v1/auth/password/forgot', ['email' => 'ada@example.com'])
            ->assertStatus(202);
    }

    $this->postJson('/api/v1/auth/password/forgot', ['email' => 'ada@example.com'])
        ->assertStatus(429)
        ->assertJsonPath('error.code', 'rate_limited');
});
