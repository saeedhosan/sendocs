<?php

declare(strict_types=1);

use App\Auth\Notifications\ResetPasswordNotification;
use App\Models\AuthIdentity;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

beforeEach(function (): void {
    // A JSON test request only carries cookies when it opts in, the way a
    // browser sends them for a same-origin fetch.
    $this->withCredentials();

    $this->owner = User::factory()->create([
        'email'    => 'ada@example.com',
        'password' => Hash::make('analytical-engine'),
    ]);
});

/**
 * The raw token from the reset link that was queued last.
 */
function rawResetToken(): string
{
    $notification = null;

    Notification::assertSentOnDemand(
        ResetPasswordNotification::class,
        function (ResetPasswordNotification $sent) use (&$notification): bool {
            $notification = $sent;

            return true;
        },
    );

    preg_match('/token=([A-Za-z0-9_-]+)$/', $notification->toMail(new User)->actionUrl, $matches);

    return $matches[1];
}

it('recovers an account from a forgotten password', function (): void {
    Notification::fake();

    // A session from before the recovery, on another device.
    $stale = test()->postJson('/api/v1/auth/login', [
        'email'    => 'ada@example.com',
        'password' => 'analytical-engine',
    ])->assertOk()->getCookie(sessionCookieName(), decrypt: false)->getValue();

    $this->postJson('/api/v1/auth/password/forgot', ['email' => 'ada@example.com'])
        ->assertStatus(202);

    $token = rawResetToken();

    $reset = $this->postJson('/api/v1/auth/password/reset', [
        'token'    => $token,
        'password' => 'difference-engine',
    ]);

    // The reset signs the owner in on the device that asked, and hands it the
    // cookie a fresh sign-in would have.
    $reset->assertOk()
        ->assertJsonPath('user.email', 'ada@example.com');

    $resetCookie = $reset->getCookie(sessionCookieName(), decrypt: false);
    expect($resetCookie)->not->toBeNull();

    // The old password is dead, everywhere.
    $this->postJson('/api/v1/auth/login', [
        'email'    => 'ada@example.com',
        'password' => 'analytical-engine',
    ])
        ->assertStatus(401)
        ->assertJsonPath('error.code', 'invalid_credentials');

    // Including on the device that was already signed in: recovery signs out
    // every other session.
    useDevice($stale);
    $this->getJson('/api/v1/auth/session')->assertStatus(401);

    // The new password works, and the device that reset it is signed in.
    $login = $this->postJson('/api/v1/auth/login', [
        'email'    => 'ada@example.com',
        'password' => 'difference-engine',
    ]);

    $login->assertOk();

    keepCookiesFrom($login);
    $this->getJson('/api/v1/auth/session')
        ->assertOk()
        ->assertJsonPath('user.id', $this->owner->getKey());
});

it('answers a password reset identically for an unknown address', function (): void {
    Notification::fake();

    $known   = $this->postJson('/api/v1/auth/password/forgot', ['email' => 'ada@example.com']);
    $unknown = $this->postJson('/api/v1/auth/password/forgot', ['email' => 'nobody@example.com']);

    $known->assertStatus(202);
    $unknown->assertStatus(202);

    // One mail, not two: the unknown address told the caller nothing, and the
    // bodies do not tell the caller anything either.
    expect($unknown->content())->toBe($known->content());

    Notification::assertCount(1);
});

it('spends a reset link once', function (): void {
    Notification::fake();

    $this->postJson('/api/v1/auth/password/forgot', ['email' => 'ada@example.com'])->assertStatus(202);

    $token = rawResetToken();

    $this->postJson('/api/v1/auth/password/reset', [
        'token'    => $token,
        'password' => 'difference-engine',
    ])->assertOk();

    $replay = $this->postJson('/api/v1/auth/password/reset', [
        'token'    => $token,
        'password' => 'analytical-engine',
    ]);

    $replay->assertStatus(410)->assertJsonPath('error.code', 'invalid_token');

    // The replay did not put the first password back.
    $this->postJson('/api/v1/auth/login', [
        'email'    => 'ada@example.com',
        'password' => 'difference-engine',
    ])->assertOk();
});

it('keeps the caller signed in on their own device when they change the password', function (): void {
    $laptop = test()->postJson('/api/v1/auth/login', [
        'email'    => 'ada@example.com',
        'password' => 'analytical-engine',
    ])->assertOk()->getCookie(sessionCookieName(), decrypt: false)->getValue();

    $phone = test()->postJson('/api/v1/auth/login', [
        'email'    => 'ada@example.com',
        'password' => 'analytical-engine',
    ])->assertOk()->getCookie(sessionCookieName(), decrypt: false)->getValue();

    useDevice($laptop);
    $session = $this->getJson('/api/v1/auth/session')->assertOk();

    $this->postJson('/api/v1/auth/password/change', [
        'currentPassword' => 'analytical-engine',
        'password'        => 'difference-engine',
    ], ['X-CSRF-Token' => $session->json('csrfToken')])
        ->assertNoContent();

    // The device that made the change is untouched.
    useDevice($laptop);
    $this->getJson('/api/v1/auth/session')->assertOk();

    // The other one is signed out, because the password it was relying on is
    // no longer the owner's.
    useDevice($phone);
    $this->getJson('/api/v1/auth/session')->assertStatus(401);

    // The new password is the one that works.
    $this->postJson('/api/v1/auth/login', [
        'email'    => 'ada@example.com',
        'password' => 'difference-engine',
    ])->assertOk();
});

it('refuses a password change from a passwordless account and recovers nothing', function (): void {
    Notification::fake();

    $google = User::factory()->create([
        'email'    => 'grace@example.com',
        'password' => null,
        'provider' => AuthIdentity::PROVIDER_GOOGLE,
    ]);

    // The account has a session, so the refusal is about the missing password
    // rather than about being signed out.
    $session = issueSessionFor($google);
    useDevice(queuedSessionToken());

    $this->postJson('/api/v1/auth/password/change', [
        'currentPassword' => 'anything at all',
        'password'        => 'difference-engine',
    ], ['X-CSRF-Token' => csrfFor($session)])
        ->assertStatus(400)
        ->assertJsonPath('error.code', 'password_not_supported');

    // And asking for a reset link sends nothing, while answering the same 202
    // it always does, so the refusal is not discoverable.
    $this->postJson('/api/v1/auth/password/forgot', ['email' => 'grace@example.com'])
        ->assertStatus(202);

    Notification::assertNothingSent();
});
