<?php

declare(strict_types=1);

namespace App\Portal\Services;

use App\Models\DocumentRequest;
use App\Exceptions\ApiException;

final readonly class MagicLinkGuard
{
    public function resolve(string $token): DocumentRequest
    {
        if (!preg_match('/^[A-Za-z0-9_-]{43}$/', $token)) {
            throw $this->invalidLink();
        }

        $request = DocumentRequest::query()
            ->where('token_hash', hash('sha256', $token))
            ->first();

        if (
            $request === null
            || $request->revoked_at !== null
            || $request->expires_at->isPast()
        ) {
            throw $this->invalidLink();
        }

        return $request;
    }

    private function invalidLink(): ApiException
    {
        return new ApiException('invalid_link', 'This link is no longer valid.', 410);
    }
}
