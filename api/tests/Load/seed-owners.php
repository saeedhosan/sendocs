<?php

declare(strict_types=1);

use App\Auth\Services\CsrfTokenService;
use App\Auth\Services\SecureToken;
use App\Models\Session;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Hash;

$apiRoot = dirname(__DIR__, 2);

require $apiRoot.'/vendor/autoload.php';

/** @var Illuminate\Foundation\Application $app */
$app = require $apiRoot.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$count = max(1, (int) ($argv[1] ?? 1010));
$password = 'benchmark-password-123';
$passwordHash = Hash::make($password);
$csrf = $app->make(CsrfTokenService::class);
$prefix = 'k6-'.bin2hex(random_bytes(6));
$identities = [];

for ($index = 0; $index < $count; $index++) {
    $user = User::query()->create([
        'name'     => 'k6 benchmark owner',
        'email'    => sprintf('%s-%04d@example.test', $prefix, $index + 1),
        'password' => $passwordHash,
        'provider' => 'custom',
    ]);

    $token = SecureToken::generate();
    $session = Session::query()->create([
        'user_id'    => $user->getKey(),
        'token_hash' => SecureToken::hash($token),
        'expires_at' => now()->addDays((int) config('session.owner_cookie.lifetime_days')),
    ]);

    $identities[] = [
        'email'     => $user->email,
        'cookie'    => $token,
        'csrfToken' => $csrf->derive($session->getKey()),
    ];
}

fwrite(STDOUT, json_encode($identities, JSON_THROW_ON_ERROR));
