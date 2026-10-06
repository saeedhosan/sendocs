<?php

namespace App\Auth\Services;

/**
 * Opaque credential generation and hashing.
 *
 * Tokens are 256 bits from a CSPRNG in URL-safe base64, and only their
 * SHA-256 hash is ever persisted.
 */
final class SecureToken
{
    /**
     * Generate a raw token.
     */
    public static function generate(): string
    {
        return rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
    }

    /**
     * Hash a token for storage or lookup.
     */
    public static function hash(string $token): string
    {
        return hash('sha256', $token);
    }
}
