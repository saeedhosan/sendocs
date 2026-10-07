<?php

declare(strict_types=1);

use App\Auth\Notifications\VerifyEmailNotification;
use App\Auth\Services\CsrfTokenService;
use App\Auth\Services\SecureToken;
use App\Auth\Services\SessionService;
use App\Models\Session;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Illuminate\Testing\TestResponse;
use Symfony\Component\HttpFoundation\Cookie as SymfonyCookie;
use Tests\Support\GoogleToken;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind different classes or traits.
|
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature', 'E2E');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', fn() => $this->toBe(1));

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

/**
 * The name of the owner session cookie.
 */
function sessionCookieName(): string
{
    return (string) config('session.owner_cookie.name');
}

/**
 * Sign in through the API, keep the raw cookie value, and return the row.
 *
 * The raw value comes back because a test sometimes has to drive two devices in
 * one run, and the signIn() helper in ResolveSessionTest can only leave the
 * newest cookie in the jar.
 *
 * @return array{0: Session, 1: string}
 */
function signInAndKeepToken(string $email = 'ada@example.com', string $password = 'analytical-engine'): array
{
    $response = test()->postJson('/api/v1/auth/login', [
        'email'    => $email,
        'password' => $password,
    ]);

    $response->assertOk();

    $token = $response->getCookie(sessionCookieName(), decrypt: false)->getValue();

    test()->withUnencryptedCookies([sessionCookieName() => $token]);
    Auth::forgetGuards();

    // Two sign-ins in the same second share a created_at, so the row is found by
    // the hash of the cookie just issued rather than by ordering.
    return [Session::query()->where('token_hash', SecureToken::hash($token))->first(), $token];
}

/**
 * Stub Google answering with a correctly signed token.
 *
 * Every test owns its stubs because a second Http::fake() would never be
 * reached: Laravel keeps the first stub that matches a url.
 *
 * @param  array<string, mixed>  $claims
 */
function fakeGoogle(array $claims = [], ?OpenSSLAsymmetricKey $key = null, ?array $response = null, int $status = 200): void
{
    Http::fake([
        'oauth2.googleapis.com/token' => Http::response(
            $response ?? ['id_token' => GoogleToken::idToken($claims, $key)],
            $status,
        ),
        'www.googleapis.com/oauth2/v3/certs' => Http::response(GoogleToken::jwks()),
    ]);
}

/**
 * Carry the cookies from a response into later requests, the way a browser's
 * cookie jar does.
 *
 * Each test request is built fresh, so a flow that spans several of them has to
 * pass the cookies on itself. The API does not encrypt its own cookies: the
 * value the browser holds is the value it presents.
 */
function keepCookiesFrom(TestResponse $response): void
{
    foreach ($response->headers->getCookies() as $cookie) {
        test()->withUnencryptedCookie($cookie->getName(), $cookie->getValue());
    }
}

/**
 * Present one saved session cookie as the current device.
 *
 * The cookie jar holds one session at a time, so a test that drives two devices
 * switches between them with this. The guard is forgotten because it caches the
 * caller it resolved for the request it saw first.
 */
function useDevice(string $sessionToken): void
{
    test()->withUnencryptedCookies([sessionCookieName() => $sessionToken]);
    Auth::forgetGuards();
}

/**
 * The CSRF token a session expects, derived the way the API derives it.
 */
function csrfFor(Session $session): string
{
    return app(CsrfTokenService::class)->derive($session->getKey());
}

/**
 * The raw token behind the cookie SessionService has just queued.
 *
 * This is the only way to sign in an account that cannot use the password login,
 * such as one that only ever signed in through an identity provider.
 */
function queuedSessionToken(): string
{
    $queued = collect(Cookie::getQueuedCookies())
        ->first(fn(SymfonyCookie $cookie): bool => $cookie->getName() === sessionCookieName());

    expect($queued)->not->toBeNull();

    return $queued->getValue();
}

/**
 * Issue a session for an owner without going through a sign-in endpoint.
 */
function issueSessionFor(User $user): Session
{
    return app(SessionService::class)->issue($user);
}

/**
 * The verification notification that was queued, for a test to read the raw
 * token back out of the link.
 */
function catchVerificationNotification(): VerifyEmailNotification
{
    $notification = null;

    Notification::assertSentOnDemand(
        VerifyEmailNotification::class,
        function (VerifyEmailNotification $sent) use (&$notification): bool {
            $notification = $sent;

            return true;
        },
    );

    return $notification ?? throw new LogicException('Verification notification was not captured.');
}

/**
 * The raw token from the verification link that was queued last.
 */
function rawVerificationToken(): string
{
    // The body does not depend on the recipient, so the mail message is built
    // without a database lookup.
    $mail = catchVerificationNotification()->toMail(new User);

    preg_match('/token=([A-Za-z0-9_-]+)$/', $mail->actionUrl, $matches);

    return $matches[1];
}
