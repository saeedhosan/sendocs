<?php

declare(strict_types=1);

namespace App\DocumentRequests\Services;

use App\Auth\Services\SecureToken;
use Illuminate\Support\Carbon;

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

    public function expiry(): Carbon
    {
        return now()->addDays(14);
    }

    public function link(string $token): string
    {
        // We will use the route name instead of a hardcoded URL when the portal route is defined
        return rtrim((string) config('app.url'), '/').'/portal/'.$token;
    }
}
