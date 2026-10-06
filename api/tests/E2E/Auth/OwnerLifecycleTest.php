<?php

use Illuminate\Support\Facades\Notification;

beforeEach(function (): void {
    // A JSON test request only carries cookies when it opts in, the way a
    // browser sends them for a same-origin fetch.
    $this->withCredentials();
});

/**
 * The whole owner lifecycle in one run: sign up, use the product before
 * verifying, verify from the emailed link, then delete the account and confirm
 * nothing is left that can be used.
 */
it('carries an owner from registration through verification to deletion', function (): void {
    Notification::fake();

    $register = $this->postJson('/api/v1/auth/register', [
        'name' => 'Ada Lovelace',
        'email' => 'ada@example.com',
        'password' => 'analytical-engine',
    ]);

    $register->assertCreated()
        ->assertJsonPath('user.email', 'ada@example.com')
        ->assertJsonPath('user.emailVerifiedAt', null)
        ->assertJsonMissingPath('user.password');

    keepCookiesFrom($register);

    // Registration signs the owner in, and verification gates nothing, so the
    // session is usable before the address is confirmed.
    $session = $this->getJson('/api/v1/auth/session');

    $session->assertOk()
        ->assertJsonPath('user.id', $register->json('user.id'))
        ->assertJsonPath('user.emailVerifiedAt', null);

    expect($session->json('csrfToken'))->toBe($register->json('csrfToken'));

    $verified = $this->getJson('/api/v1/auth/email/verify?token='.rawVerificationToken());

    $verified->assertOk();

    // The verified timestamp reaches the session, not just the verify response.
    $this->getJson('/api/v1/auth/session')
        ->assertOk()
        ->assertJsonPath('user.id', $register->json('user.id'))
        ->assertJsonPath('user.emailVerifiedAt', $verified->json('emailVerifiedAt'));

    $this->deleteJson('/api/v1/auth/account', [
        'password' => 'analytical-engine',
        'confirm' => 'ada@example.com',
    ], ['X-CSRF-Token' => $session->json('csrfToken')])
        ->assertNoContent();

    // The account is gone, so its session cannot resolve and its password
    // cannot sign in again.
    $this->getJson('/api/v1/auth/session')
        ->assertStatus(401)
        ->assertJsonPath('error.code', 'unauthenticated');

    $this->postJson('/api/v1/auth/login', [
        'email' => 'ada@example.com',
        'password' => 'analytical-engine',
    ])
        ->assertStatus(401)
        ->assertJsonPath('error.code', 'invalid_credentials');
});

it('leaves a deleted account unable to reuse its verification link', function (): void {
    Notification::fake();

    keepCookiesFrom($this->postJson('/api/v1/auth/register', [
        'name' => 'Ada Lovelace',
        'email' => 'ada@example.com',
        'password' => 'analytical-engine',
    ])->assertCreated());

    $token = rawVerificationToken();
    $csrf = $this->getJson('/api/v1/auth/session')->json('csrfToken');

    $this->deleteJson('/api/v1/auth/account', [
        'password' => 'analytical-engine',
        'confirm' => 'ada@example.com',
    ], ['X-CSRF-Token' => $csrf])->assertNoContent();

    // The link outlived the account it pointed at, and is inert.
    $this->getJson('/api/v1/auth/email/verify?token='.$token)
        ->assertStatus(410)
        ->assertJsonPath('error.code', 'invalid_token');
});

it('lets an owner resend a verification link and use the new one', function (): void {
    Notification::fake();

    keepCookiesFrom($this->postJson('/api/v1/auth/register', [
        'name' => 'Ada Lovelace',
        'email' => 'ada@example.com',
        'password' => 'analytical-engine',
    ])->assertCreated());

    $superseded = rawVerificationToken();
    $csrf = $this->getJson('/api/v1/auth/session')->json('csrfToken');

    $this->postJson('/api/v1/auth/email/resend', [], ['X-CSRF-Token' => $csrf])->assertStatus(202);

    $current = rawVerificationToken();

    expect($current)->not->toBe($superseded);

    // Only the newest link works, so a mail that was already delivered is dead.
    $this->getJson('/api/v1/auth/email/verify?token='.$superseded)->assertStatus(410);

    $this->getJson('/api/v1/auth/email/verify?token='.$current)->assertOk();
});
