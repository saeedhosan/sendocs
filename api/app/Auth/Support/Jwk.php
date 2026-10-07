<?php

declare(strict_types=1);

namespace App\Auth\Support;

use RuntimeException;

/**
 * Convert a JSON Web Key into a PEM public key.
 *
 * Google's published keys are RSA moduli and exponents in base64url, so the
 * SubjectPublicKeyInfo structure is assembled here and handed to OpenSSL for
 * signature verification.
 */
final class Jwk
{
    /**
     * Build the PEM public key for an RSA JWK.
     *
     * @param  array<string, mixed>  $jwk
     */
    public static function toPem(array $jwk): string
    {
        $modulus  = self::base64UrlDecode($jwk['n'] ?? null);
        $exponent = self::base64UrlDecode($jwk['e'] ?? null);

        if ($modulus === null || $exponent === null) {
            throw new RuntimeException('The published key is not a usable RSA key.');
        }

        $rsaPublicKey = self::derSequence(
            self::derInteger($modulus).self::derInteger($exponent),
        );

        $subjectPublicKeyInfo = self::derSequence(
            self::derSequence(self::derOid('1.2.840.113549.1.1.1')."\x05\x00")
            .self::derBitString($rsaPublicKey),
        );

        return "-----BEGIN PUBLIC KEY-----\n"
            .chunk_split(base64_encode($subjectPublicKeyInfo), 64, "\n")
            ."-----END PUBLIC KEY-----\n";
    }

    /**
     * Decode a base64url value.
     */
    private static function base64UrlDecode(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $decoded = base64_decode(strtr($value, '-_', '+/'), true);

        return $decoded === false ? null : $decoded;
    }

    /**
     * Wrap content in a DER SEQUENCE with its length.
     */
    private static function derSequence(string $content): string
    {
        return "\x30".self::derLength(strlen($content)).$content;
    }

    /**
     * Wrap content in a DER BIT STRING, unused bits first.
     */
    private static function derBitString(string $content): string
    {
        $content = "\x00".$content;

        return "\x03".self::derLength(strlen($content)).$content;
    }

    /**
     * Wrap a big-endian integer, keeping it unsigned and non-empty.
     */
    private static function derInteger(string $bytes): string
    {
        $bytes = ltrim($bytes, "\x00");

        if ($bytes === '') {
            $bytes = "\x00";
        }

        if (ord($bytes[0]) >= 0x80) {
            $bytes = "\x00".$bytes;
        }

        return "\x02".self::derLength(strlen($bytes)).$bytes;
    }

    /**
     * Encode a dotted object identifier as a DER OID.
     */
    private static function derOid(string $oid): string
    {
        $parts   = array_map(intval(...), explode('.', $oid));
        $encoded = chr(array_shift($parts) * 40 + array_shift($parts));

        foreach ($parts as $part) {
            $groups = [];

            do {
                $groups[] = $part & 0x7F;
                $part >>= 7;
            } while ($part > 0);

            $groups = array_reverse($groups);
            $last   = count($groups) - 1;

            foreach ($groups as $index => $group) {
                $encoded .= chr($group | ($index === $last ? 0x00 : 0x80));
            }
        }

        return "\x06".self::derLength(strlen($encoded)).$encoded;
    }

    /**
     * Encode a DER length, long form past one byte.
     */
    private static function derLength(int $length): string
    {
        if ($length < 0x80) {
            return chr($length);
        }

        $bytes = '';

        while ($length > 0) {
            $bytes = chr($length & 0xFF).$bytes;
            $length >>= 8;
        }

        return chr(0x80 | strlen($bytes)).$bytes;
    }
}
