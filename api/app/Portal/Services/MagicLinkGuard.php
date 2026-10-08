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

        if ($request === null) {
            throw $this->invalidLink();
        }

        $expiresAt = $request->getAttributeValue('expires_at');
        assert($expiresAt instanceof \Illuminate\Support\Carbon);

        if ($request->revoked_at !== null || $expiresAt->isPast()) {
            throw $this->invalidLink();
        }

        return $request;
    }

    private function invalidLink(): ApiException
    {
        return new ApiException('invalid_link', 'This link is no longer valid.', 410);
    }
}
