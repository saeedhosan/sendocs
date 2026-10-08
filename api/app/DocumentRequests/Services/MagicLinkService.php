<?php

declare(strict_types=1);

namespace App\DocumentRequests\Services;

use App\Auth\Services\SecureToken;

final readonly class MagicLinkService
{
    public function generate(): string
    {
        return SecureToken::generate();
    }

    public function hash(string $token): string
    {
        return SecureToken::hash($token);
    }

    public function expiry(): \Illuminate\Support\Carbon
    {
        return now()->addDays(14);
    }

    public function link(string $token): string
    {
        return rtrim((string) config('app.url'), '/').'/portal/'.$token;
    }
}
