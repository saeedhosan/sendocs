<?php

declare(strict_types=1);

namespace App\DocumentRequests\Services;

use App\Auth\Services\SecureToken;
use App\Models\DocumentRequest;

final readonly class MagicLinkService
{
    public function issue(DocumentRequest $request): string
    {
        return $this->link($request->token_hash, $request->expires_at);
    }

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

    private function link(string $hash, \Illuminate\Support\Carbon $expiresAt): string
    {
        // The raw token is intentionally supplied by create() only after commit.
        return rtrim((string) config('app.url'), '/').'/portal/'.$hash;
    }
}