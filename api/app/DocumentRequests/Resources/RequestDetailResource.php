<?php

declare(strict_types=1);

namespace App\DocumentRequests\Resources;

use App\Models\DocumentRequest;
use App\Models\RequestItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

class RequestDetailResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        /** @var DocumentRequest $model */
        $model = $this->resource;
        $items = $model->items;

        $createdAt = $model->getAttributeValue('created_at');
        $expiresAt = $model->getAttributeValue('expires_at');
        $revokedAt = $model->getAttributeValue('revoked_at');

        assert($createdAt instanceof Carbon);
        assert($expiresAt instanceof Carbon);
        assert($revokedAt === null || $revokedAt instanceof Carbon);

        return [
            'id' => $model->getKey(),
            'title' => $model->title,
            'status' => 'waiting',
            'uploaded' => 0,
            'total' => count($items),
            'lastActivityAt' => null,
            'createdAt' => $createdAt->toIso8601String(),
            'expiresAt' => $expiresAt->toIso8601String(),
            'revokedAt' => $revokedAt?->toIso8601String(),
            'items' => array_map(static fn (RequestItem $item): array => [
                'id' => $item->getKey(),
                'label' => $item->label,
                'position' => $item->position,
                'state' => 'waiting',
                'document' => null,
            ], $items->all()),
        ];
    }
}
