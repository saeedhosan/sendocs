<?php

declare(strict_types=1);

namespace App\Account\Data;

final readonly class UserData
{
    public function __construct(
        public string $name,
    ) {}
}
