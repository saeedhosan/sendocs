<?php

declare(strict_types=1);

use App\\Models\\User;
use Illuminate\\Contracts\\Console\\Kernel;
use Illuminate\\Support\\Str;

require __DIR__ . '/../../vendor/autoload.php';

$app = require_once __DIR__ . '/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$count = isset($argv[1]) ? filter_var($argv[1], FILTER_VALIDATE_INT) : false;

if ($count === false || $count < 1) {
    fwrite(STDERR, "Usage: php tests/Load/seed-owners.php <count>\n");
    exit(1);
}

$password = 'benchmark-password-123';
$owners = [];

for ($index = 1; $index <= $count; $index++) {
    $email = sprintf(
        'benchmark-owner-%d-%s@example.test',
        $index,
        Str::uuid(),
    );

    User::factory()->create([
        'email' => $email,
        'password' => $password,
    ]);

    $owners[] = ['email' => $email];
}

echo json_encode($owners, JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT) . PHP_EOL;
