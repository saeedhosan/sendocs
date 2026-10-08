<?php

declare(strict_types=1);

namespace App\DocumentRequests\Resources;

use App\Models\DocumentRequest;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

class RequestSummaryResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        /** @var DocumentRequest $model */
        $model = $this->resource;

        $createdAt = $model->getAttributeValue('created_at');
        $expiresAt = $model->getAttributeValue('expires_at');
        $revokedAt = $model->getAttributeValue('revoked_at');

        assert($createdAt instanceof Carbon);
        assert($expiresAt instanceof Carbon);
        assert($revokedAt === null || $revokedAt instanceof Carbon);

        $items = $model->items;
        $uploaded = $items->filter(static fn ($item): bool => $item->document !== null)->count();
        $lastActivityAt = $items
            ->map(fn ($item) => $item->document?->uploaded_at)
            ->filter()
            ->max();

        return [
            'id' => $model->getKey(),
            'title' => $model->title,
            'status' => $uploaded === $items->count() ? 'complete' : 'waiting',
            'uploaded' => $uploaded,
            'total' => $items->count(),
            'lastActivityAt' => $lastActivityAt instanceof Carbon ? $lastActivityAt->toIso8601String() : null,
            'createdAt' => $createdAt->toIso8601String(),
            'expiresAt' => $expiresAt->toIso8601String(),
            'revokedAt' => $revokedAt?->toIso8601String(),
        ];
    }
}
