<?php

declare(strict_types=1);

namespace App\DocumentRequests\Actions;

use App\Exceptions\ApiException;
use App\Models\DocumentRequest;
use App\Models\User;

final readonly class ShowRequest
{
    public function handle(User $owner, string $requestId): DocumentRequest
    {
        $request = DocumentRequest::query()
            ->whereKey($requestId)
            ->where('owner_id', $owner->getKey())
            ->with('items.document')
            ->first();

        if ($request === null) {
            throw new ApiException('not_found', 'Not found.', 404);
        }

        return $request;
    }
}
