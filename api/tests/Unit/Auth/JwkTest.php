<?php

use App\Auth\Support\Jwk;

it('builds a public key byte for byte identical to the one openssl derives', function (): void {
    $privateKey = openssl_pkey_new([
        'private_key_type' => OPENSSL_KEYTYPE_RSA,
        'private_key_bits' => 2048,
    ]);

    $details = openssl_pkey_get_details($privateKey);

    $pem = Jwk::toPem([
        'kty' => 'RSA',
        'n' => rtrim(strtr(base64_encode($details['rsa']['n']), '+/', '-_'), '='),
        'e' => rtrim(strtr(base64_encode($details['rsa']['e']), '+/', '-_'), '='),
    ]);

    expect($pem)->toBe($details['key']);
});

it('verifies a signature made by the matching private key', function (): void {
    $privateKey = openssl_pkey_new([
        'private_key_type' => OPENSSL_KEYTYPE_RSA,
        'private_key_bits' => 2048,
    ]);

    $details = openssl_pkey_get_details($privateKey);
    openssl_pkey_export($privateKey, $exported);
    openssl_sign('header.payload', $signature, $exported, OPENSSL_ALGO_SHA256);

    $pem = Jwk::toPem([
        'n' => rtrim(strtr(base64_encode($details['rsa']['n']), '+/', '-_'), '='),
        'e' => rtrim(strtr(base64_encode($details['rsa']['e']), '+/', '-_'), '='),
    ]);

    expect(openssl_pkey_get_public($pem))->not->toBeFalse()
        ->and(openssl_verify('header.payload', $signature, $pem, OPENSSL_ALGO_SHA256))->toBe(1)
        ->and(openssl_verify('header.other', $signature, $pem, OPENSSL_ALGO_SHA256))->not->toBe(1);
});

it('rejects a key that is missing its modulus or exponent', function (): void {
    expect(fn () => Jwk::toPem(['kty' => 'RSA', 'e' => 'AQAB']))->toThrow(RuntimeException::class);
});
