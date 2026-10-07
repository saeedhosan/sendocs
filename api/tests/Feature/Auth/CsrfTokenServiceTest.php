<?php

declare(strict_types=1);

use App\Auth\Services\CsrfTokenService;

test('the derived token is stable for one session and differs across sessions', function (): void {
    $csrf = new CsrfTokenService;

    $first  = $csrf->derive('session-a');
    $second = $csrf->derive('session-b');

    expect($first)->toBe($csrf->derive('session-a'))
        ->and($first)->not->toBe($second);
});

test('a token from one session is rejected on another', function (): void {
    $csrf = new CsrfTokenService;

    expect($csrf->verify('session-a', $csrf->derive('session-a')))->toBeTrue()
        ->and($csrf->verify('session-b', $csrf->derive('session-a')))->toBeFalse()
        ->and($csrf->verify('session-a', null))->toBeFalse()
        ->and($csrf->verify('session-a', 'not-the-token'))->toBeFalse();
});

test('changing the secret invalidates every derived token', function (): void {
    $csrf   = new CsrfTokenService;
    $before = $csrf->derive('session-a');

    config(['auth.csrf_secret' => 'a-rotated-secret']);

    expect($csrf->derive('session-a'))->not->toBe($before)
        ->and($csrf->verify('session-a', $before))->toBeFalse();
});
