<?php

declare(strict_types=1);

use App\Models\AccountToken;
use App\Models\AuthIdentity;
use App\Models\Session;
use App\Models\User;
use App\Models\DocumentRequest;
use Illuminate\Support\Facades\Storage;
use Illuminate\Cache\RateLimiter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

beforeEach(function (): void {
    $this->withCredentials();

    $this->owner = User::factory()->create([
        'email'    => 'ada@example.com',
        'password' => Hash::make('analytical-engine'),
    ]);
});

/**
 * Delete the account, sending a CSRF token only when one is passed. Omitting it
 * is how the CSRF check itself is tested, because that middleware runs first.
 */
function deleteAccount(
    string $password = 'analytical-engine',
    string $confirm = 'ada@example.com',
    ?string $csrf = null,
) {
    return test()->deleteJson('/api/v1/auth/account', [
        'password' => $password,
        'confirm'  => $confirm,
    ], $csrf === null ? [] : ['X-CSRF-Token' => $csrf]);
}

it('deletes the account and everything hanging off it', function (): void {
    [$session] = signInAndKeepToken();

    // One row of each kind that cascades, so the delete is proven to cascade
    // rather than to leave rows pointing at nothing.
    AccountToken::query()->create([
        'user_id'    => $this->owner->getKey(),
        'purpose'    => AccountToken::PURPOSE_EMAIL_VERIFICATION,
        'token_hash' => hash('sha256', 'a-verification-token'),
        'expires_at' => now()->addHour(),
    ]);

    AuthIdentity::query()->create([
        'user_id'     => $this->owner->getKey(),
        'provider'    => AuthIdentity::PROVIDER_GOOGLE,
        'provider_id' => '1234567890',
    ]);

    deleteAccount('analytical-engine', 'ada@example.com', csrfFor($session))
        ->assertNoContent();

    expect(User::query()->count())->toBe(0)
        ->and(Session::query()->count())->toBe(0)
        ->and(AccountToken::query()->count())->toBe(0)
        ->and(AuthIdentity::query()->count())->toBe(0);
});

it('queues owned file cleanup when deleting an account', function (): void {
    Storage::fake('s3');
    [$session] = signInAndKeepToken();

    $request = DocumentRequest::create([
        'owner_id' => $this->owner->getKey(),
        'title' => 'Tax Documents',
        'token_hash' => hash('sha256', 'account-deletion-token'),
        'expires_at' => now()->addDays(14),
    ]);
    $item = $request->items()->create([
        'label' => 'Tax return',
        'position' => 1,
    ]);
    Storage::disk('s3')->put('account/file.pdf', 'pdf');
    $item->document()->create([
        'storage_key' => 'account/file.pdf',
        'original_name' => 'file.pdf',
        'mime_type' => 'application/pdf',
        'size_bytes' => 3,
        'sha256' => hash('sha256', 'pdf'),
        'uploaded_at' => now(),
    ]);

    deleteAccount('analytical-engine', 'ada@example.com', csrfFor($session))
        ->assertNoContent();

    expect(DB::table('storage_deletion_outbox')->where('storage_key', 'account/file.pdf')->exists())->toBeTrue();

    test()->artisan('storage:cleanup')->assertExitCode(0);
    Storage::disk('s3')->assertMissing('account/file.pdf');
});

it('expires the session cookie so the browser stops sending it', function (): void {
    [$session] = signInAndKeepToken();

    $response = deleteAccount('analytical-engine', 'ada@example.com', csrfFor($session));

    $response->assertNoContent();

    // Not decrypted: a forget cookie carries an empty value, and there is
    // nothing to decrypt.
    $cookie = $response->getCookie(sessionCookieName(), decrypt: false);

    expect($cookie)->not->toBeNull()
        ->and($cookie->getValue())->toBeNull()
        ->and($cookie->getPath())->toBe('/');
});

it('leaves the cookie and the account in place when the password is wrong', function (): void {
    [$session] = signInAndKeepToken();

    deleteAccount('not-the-password', 'ada@example.com', csrfFor($session))
        ->assertStatus(401)
        ->assertJsonPath('error.code', 'invalid_credentials');

    expect(User::query()->count())->toBe(1)
        ->and(Session::query()->count())->toBe(1)
        ->and($this->owner->fresh())->not->toBeNull();
});

it('refuses a mismatched confirmation and keeps the account', function (): void {
    [$session] = signInAndKeepToken();

    deleteAccount('analytical-engine', 'grace@example.com', csrfFor($session))
        ->assertStatus(422)
        ->assertJsonPath('error.code', 'validation_failed')
        ->assertJsonStructure(['error' => ['details' => ['confirm']]]);

    expect(User::query()->count())->toBe(1)
        ->and(Session::query()->count())->toBe(1);
});

it('requires the confirmation to match the stored address', function (): void {
    [$session] = signInAndKeepToken();

    deleteAccount('analytical-engine', '  Ada@Example.COM ', csrfFor($session))
        ->assertStatus(422)
        ->assertJsonPath('error.code', 'validation_failed');

    expect(User::query()->count())->toBe(1);
});

it('refuses an account with no password', function (): void {
    $google = User::factory()->create([
        'email'    => 'grace@example.com',
        'password' => null,
        'provider' => AuthIdentity::PROVIDER_GOOGLE,
    ]);

    $session = issueSessionFor($google);
    $this->withUnencryptedCookies([sessionCookieName() => queuedSessionToken()]);
    Auth::forgetGuards();

    deleteAccount('irrelevant', 'grace@example.com', csrfFor($session))
        ->assertStatus(400)
        ->assertJsonPath('error.code', 'password_not_supported')
        ->assertJsonPath('error.message', 'Password operations are not available for this account.');

    expect(User::query()->count())->toBe(2)
        ->and(Session::query()->count())->toBe(1);
});

it('needs a session', function (): void {
    $this->deleteJson('/api/v1/auth/account', [
        'password' => 'analytical-engine',
        'confirm'  => 'ada@example.com',
    ])
        ->assertStatus(401)
        ->assertJsonPath('error.code', 'unauthenticated');

    expect(User::query()->count())->toBe(1);
});

it('needs a csrf token', function (): void {
    signInAndKeepToken();

    deleteAccount()
        ->assertStatus(403)
        ->assertJsonPath('error.code', 'csrf_failed');

    expect(User::query()->count())->toBe(1);
});

it('validates the payload and keeps the account', function (): void {
    [$session] = signInAndKeepToken();

    test()->deleteJson('/api/v1/auth/account', ['confirm' => 'ada@example.com'], [
        'X-CSRF-Token' => csrfFor($session),
    ])
        ->assertStatus(422)
        ->assertJsonStructure(['error' => ['details' => ['password']]]);

    test()->deleteJson('/api/v1/auth/account', [
        'password' => 'analytical-engine',
        'confirm'  => 'not-an-email',
    ], ['X-CSRF-Token' => csrfFor($session)])
        ->assertStatus(422)
        ->assertJsonStructure(['error' => ['details' => ['confirm']]]);

    expect(User::query()->count())->toBe(1);
});

it('rate limits deletion to 120 a minute per owner', function (): void {
    // The definition is checked rather than a run of 120 deletions, which would
    // mean 120 bcrypt verifications and then 120 cascades.
    $request = Request::create('/api/v1/auth/account', 'DELETE');
    $request->setUserResolver(fn (): User => $this->owner);

    $limit = app(RateLimiter::class)->limiter('auth.account.destroy')($request);

    expect($limit->maxAttempts)->toBe(120)
        ->and($limit->decaySeconds)->toBe(60)
        ->and($limit->key)->toBe($this->owner->getKey());
});
