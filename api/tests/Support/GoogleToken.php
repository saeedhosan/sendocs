<?php

declare(strict_types=1);

namespace Tests\Support;

use OpenSSLAsymmetricKey;

/**
 * Builds Google-shaped tokens and a matching published key set.
 *
 * The signature is produced with a real RSA key so the service verifies
 * exactly what it would see in production.
 */
final class GoogleToken
{
    /**
     * The key id of the signing key.
     */
    public const string KID = 'test-key-1';

    /**
     * The client id the tokens are issued for.
     */
    public const string CLIENT_ID = 'test-client-id.apps.googleusercontent.com';

    private static ?OpenSSLAsymmetricKey $privateKey = null;

    /**
     * A signed ID token.
     *
     * @param  array<string, mixed>  $claims
     */
    public static function idToken(array $claims = [], ?OpenSSLAsymmetricKey $privateKey = null): string
    {
        $privateKey ??= self::privateKey();
        $header  = self::base64Url((string) json_encode(['alg' => 'RS256', 'typ' => 'JWT', 'kid' => self::KID]));
        $payload = self::base64Url((string) json_encode(array_merge([
            'iss'            => 'https://accounts.google.com',
            'aud'            => self::CLIENT_ID,
            'sub'            => 'google-subject-1',
            'email'          => 'owner@example.com',
            'email_verified' => true,
            'name'           => 'Owner',
            'iat'            => now()->getTimestamp(),
            'exp'            => now()->addHour()->getTimestamp(),
        ], $claims)));

        openssl_sign($header.'.'.$payload, $signature, $privateKey, OPENSSL_ALGO_SHA256);

        return $header.'.'.$payload.'.'.self::base64Url($signature);
    }

    /**
     * The published key set containing the signing key.
     *
     * @return array<string, mixed>
     */
    public static function jwks(?OpenSSLAsymmetricKey $privateKey = null): array
    {
        $details = openssl_pkey_get_details($privateKey ?? self::privateKey());

        return [
            'keys' => [
                [
                    'kty' => 'RSA',
                    'alg' => 'RS256',
                    'use' => 'sig',
                    'kid' => self::KID,
                    'n'   => self::base64Url($details['rsa']['n']),
                    'e'   => self::base64Url($details['rsa']['e']),
                ],
            ],
        ];
    }

    /**
     * A second, unrelated signing key.
     */
    public static function untrustedPrivateKey(): OpenSSLAsymmetricKey
    {
        return openssl_pkey_new([
            'private_key_type' => OPENSSL_KEYTYPE_RSA,
            'private_key_bits' => 2048,
        ]);
    }

    /**
     * The cached signing key for the test run.
     */
    private static function privateKey(): OpenSSLAsymmetricKey
    {
        return self::$privateKey ??= openssl_pkey_new([
            'private_key_type' => OPENSSL_KEYTYPE_RSA,
            'private_key_bits' => 2048,
        ]);
    }

    /**
     * Encode a value as base64url.
     */
    private static function base64Url(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
