<?php

declare(strict_types=1);

namespace App\DocumentRequests\Resources;

use App\Models\DocumentRequest;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RequestDetailResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        /** @var DocumentRequest $model */
        $model = $this->resource;
        $items = $model->items;

        return [
            'id' => $model->getKey(),
            'title' => $model->title,
            'status' => 'waiting',
            'uploaded' => 0,
            'total' => count($items),
            'lastActivityAt' => null,
            'createdAt' => $model->created_at->toIso8601String(),
            'expiresAt' => $model->expires_at->toIso8601String(),
            'revokedAt' => $model->revoked_at?->toIso8601String(),
            'items' => array_map(static fn ($item): array => [
                'id' => $item->getKey(),
                'label' => $item->label,
                'position' => $item->position,
                'state' => 'waiting',
                'document' => null,
            ], $items->all()),
        ];
    }
}