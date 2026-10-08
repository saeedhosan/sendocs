<?php

declare(strict_types=1);

namespace App\DocumentRequests\Actions;

use App\Exceptions\ApiException;
use App\Models\DocumentRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class RevokeRequest
{
    public function handle(User $owner, string $requestId): DocumentRequest
    {
        return DB::transaction(function () use ($owner, $requestId): DocumentRequest {
            $request = DocumentRequest::query()
                ->whereKey($requestId)
                ->where('owner_id', $owner->getKey())
                ->lockForUpdate()
                ->first();

            if ($request === null) {
                throw new ApiException('not_found', 'Not found.', 404);
            }

            if ($request->revoked_at === null) {
                $request->revoked_at = now()->toDateTimeString();
                $request->save();
            }

            return $request->load('items');
        });
    }
}
