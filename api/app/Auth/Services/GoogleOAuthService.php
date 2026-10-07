<?php

declare(strict_types=1);

namespace App\Auth\Services;

use App\Auth\Support\Jwk;
use App\Exceptions\ApiException;
use App\Models\AuthIdentity;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/**
 * Google sign-in over the Authorization Code flow with PKCE.
 *
 * The ID token is verified against Google's published keys and never trusted
 * before that, so an unsigned or replayed assertion cannot create an account.
 */
final class GoogleOAuthService
{
    private const string AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

    private const string TOKEN_URL = 'https://oauth2.googleapis.com/token';

    private const string JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';

    private const string ISSUER = 'https://accounts.google.com';

    private const array SCOPES = ['openid', 'email', 'profile'];

    private const string JWKS_CACHE_KEY = 'auth.oauth.google.jwks';

    /**
     * Generate a state-protected authorization URL with a PKCE challenge.
     *
     * The verifier and the state are stored, so the callback can prove the
     * redirect belongs to the sign-in that started it.
     */
    public function generateAuthUrl(): string
    {
        $state    = Str::random(40);
        $verifier = Str::random(96);

        Cache::put($this->stateKey($state), ['verifier' => $verifier], now()->addMinutes((int) config('services.google.state_lifetime_minutes')));

        return self::AUTHORIZE_URL.'?'.http_build_query([
            'client_id'             => $this->clientId(),
            'redirect_uri'          => $this->redirectUri(),
            'response_type'         => 'code',
            'scope'                 => implode(' ', self::SCOPES),
            'state'                 => $state,
            'code_challenge'        => $this->challengeFor($verifier),
            'code_challenge_method' => 'S256',
        ]);
    }

    /**
     * Consume a callback state and return its PKCE verifier.
     *
     * The state is removed on read, so a replayed callback finds nothing and
     * the authorization code can only be redeemed once.
     */
    public function consumeState(string $state): string
    {
        $stored = Cache::pull($this->stateKey($state));

        if (! is_array($stored) || ! isset($stored['verifier'])) {
            throw ApiException::oauthFailed('That sign-in link has expired. Try signing in again.');
        }

        return $stored['verifier'];
    }

    /**
     * Exchange an authorization code for the caller's verified profile.
     *
     * @return array{sub: string, email: string, name: string}
     */
    public function exchangeCode(string $code, string $codeVerifier): array
    {
        $body = $this->callGoogle(fn () => Http::asForm()->post(self::TOKEN_URL, [
            'grant_type'    => 'authorization_code',
            'code'          => $code,
            'client_id'     => $this->clientId(),
            'client_secret' => (string) config('services.google.client_secret'),
            'redirect_uri'  => $this->redirectUri(),
            'code_verifier' => $codeVerifier,
        ]));

        $idToken = $body['id_token'] ?? null;

        if (! is_string($idToken)) {
            throw ApiException::oauthFailed('Google did not return a usable sign-in token.');
        }

        return $this->verifyIdToken($idToken);
    }

    /**
     * Find the owner behind a verified Google profile, or create one.
     *
     * An address already registered under another sign-in method is never
     * linked silently, so a stolen provider account cannot take an existing
     * owner over.
     *
     * @param  array{sub: string, email: string, name: string}  $profile
     */
    public function findOrCreateUser(array $profile): User
    {
        $identity = $this->existingIdentity($profile);

        if ($identity instanceof AuthIdentity) {
            return $identity->user;
        }

        $existing = User::query()->where('email', $profile['email'])->first();

        if ($existing !== null) {
            throw ApiException::oauthProviderConflict();
        }

        try {
            return $this->createGoogleUser($profile);
        } catch (QueryException $queryException) {
            // Two callbacks for one Google account can both miss the lookup.
            // The unique index settles it, so the loser reads the winner
            // rather than failing a sign-in the owner already completed.
            $winner = $this->existingIdentity($profile);

            if (! $winner instanceof AuthIdentity) {
                throw $queryException;
            }

            return $winner->user;
        }
    }

    /**
     * Create an owner and its Google identity together.
     *
     * @param  array{sub: string, email: string, name: string}  $profile
     */
    private function createGoogleUser(array $profile): User
    {
        return DB::transaction(function () use ($profile): User {
            $user = User::query()->create([
                'name'     => $profile['name'],
                'email'    => $profile['email'],
                'provider' => AuthIdentity::PROVIDER_GOOGLE,
            ]);

            // Only Google has confirmed the address, so the owner never needs
            // to verify it again. Not mass assignable anywhere else.
            $user->forceFill(['email_verified_at' => now()])->save();

            AuthIdentity::query()->create([
                'user_id'     => $user->getKey(),
                'provider'    => AuthIdentity::PROVIDER_GOOGLE,
                'provider_id' => $profile['sub'],
            ]);

            return $user;
        });
    }

    /**
     * The provider subject that identifies a Google account.
     *
     * @param  array{sub: string}  $profile
     */
    private function existingIdentity(array $profile): ?AuthIdentity
    {
        return AuthIdentity::query()
            ->where('provider', AuthIdentity::PROVIDER_GOOGLE)
            ->where('provider_id', $profile['sub'])
            ->first();
    }

    /**
     * Verify an ID token's signature and claims, then read its profile.
     *
     * @return array{sub: string, email: string, name: string}
     */
    private function verifyIdToken(string $idToken): array
    {
        [$encodedHeader, $encodedClaims, $encodedSignature, $signedPart] = $this->splitToken($idToken);

        $header = json_decode($this->decodeSegment($encodedHeader), true);
        $claims = json_decode($this->decodeSegment($encodedClaims), true);

        if (! is_array($header) || ! is_array($claims)) {
            throw ApiException::oauthFailed('Google returned an unreadable sign-in token.');
        }

        if (($header['alg'] ?? null) !== 'RS256') {
            throw ApiException::oauthFailed('Google signed the token with an unsupported algorithm.');
        }

        $verified = openssl_verify(
            $signedPart,
            $this->decodeSegment($encodedSignature),
            $this->publicKeyFor((string) ($header['kid'] ?? '')),
            OPENSSL_ALGO_SHA256,
        );

        if ($verified !== 1) {
            throw ApiException::oauthFailed('Google sign-in token could not be verified.');
        }

        $this->assertValidClaims($claims);

        $sub   = $claims['sub']   ?? null;
        $email = $claims['email'] ?? null;
        $name  = $claims['name']  ?? null;

        if (! is_string($sub) || $sub === '' || ! is_string($email) || ! is_string($name)) {
            throw ApiException::oauthFailed('Google returned an incomplete profile.');
        }

        if (($claims['email_verified'] ?? false) !== true) {
            throw ApiException::oauthFailed('Google did not confirm a verified email address.');
        }

        return [
            'sub'   => $sub,
            'email' => mb_strtolower($email),
            'name'  => Str::limit($name, 120, ''),
        ];
    }

    /**
     * Reject a token that was not issued for this application or has expired.
     *
     * @param  array<string, mixed>  $claims
     */
    private function assertValidClaims(array $claims): void
    {
        $expiresAt = $claims['exp'] ?? null;

        if (($claims['iss'] ?? null)    !== self::ISSUER
            || ($claims['aud'] ?? null) !== $this->clientId()
            || ! is_numeric($expiresAt)
            || (int) $expiresAt < now()->getTimestamp()) {
            throw ApiException::oauthFailed('Google sign-in token was not issued for this application.');
        }
    }

    /**
     * The published Google key that signed a token.
     */
    private function publicKeyFor(string $kid): string
    {
        $body = Cache::remember(
            self::JWKS_CACHE_KEY,
            now()->addDay(),
            fn (): array => $this->callGoogle(fn () => Http::get(self::JWKS_URL)),
        );

        foreach ($body['keys'] ?? [] as $key) {
            if (is_array($key) && ($key['kid'] ?? null) === $kid) {
                return Jwk::toPem($key);
            }
        }

        throw ApiException::oauthFailed('Google published no key for this sign-in.');
    }

    /**
     * Read a JSON response from Google, or fail the documented way.
     *
     * A provider that is down or refuses the exchange is a failed sign-in, not
     * a server fault, so it never escapes as an unhandled client exception.
     *
     * @param  callable(): Response  $request
     * @return array<string, mixed>
     */
    private function callGoogle(callable $request): array
    {
        try {
            $response = $request();
        } catch (ConnectionException) {
            throw ApiException::oauthFailed('Could not reach Google. Try again.');
        }

        if (! $response->successful()) {
            throw ApiException::oauthFailed('Google rejected the sign-in attempt.');
        }

        $body = $response->json();

        return is_array($body) ? $body : [];
    }

    /**
     * Split a JWT into its three parts and the bytes they sign.
     *
     * @return array{0: string, 1: string, 2: string, 3: string}
     */
    private function splitToken(string $token): array
    {
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            throw ApiException::oauthFailed('Google returned an unreadable sign-in token.');
        }

        return [$parts[0], $parts[1], $parts[2], $parts[0].'.'.$parts[1]];
    }

    /**
     * Decode one base64url JWT segment.
     */
    private function decodeSegment(string $segment): string
    {
        $decoded = base64_decode(strtr($segment, '-_', '+/'), true);

        if ($decoded === false) {
            throw ApiException::oauthFailed('Google returned an unreadable sign-in token.');
        }

        return $decoded;
    }

    /**
     * The PKCE challenge for a verifier.
     */
    private function challengeFor(string $verifier): string
    {
        return rtrim(strtr(base64_encode(hash('sha256', $verifier, true)), '+/', '-_'), '=');
    }

    /**
     * The cache key holding one sign-in attempt.
     */
    private function stateKey(string $state): string
    {
        return 'auth.oauth.google.state.'.hash('sha256', $state);
    }

    /**
     * The configured client id.
     */
    private function clientId(): string
    {
        $clientId = config('services.google.client_id');

        if (! is_string($clientId) || $clientId === '') {
            throw ApiException::oauthFailed('Google sign-in is not configured.');
        }

        return $clientId;
    }

    /**
     * The configured redirect uri.
     */
    private function redirectUri(): string
    {
        $redirectUri = config('services.google.redirect_uri');

        if (! is_string($redirectUri) || $redirectUri === '') {
            throw ApiException::oauthFailed('Google sign-in is not configured.');
        }

        return $redirectUri;
    }
}
