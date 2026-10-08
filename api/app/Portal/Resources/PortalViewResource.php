<?php

declare(strict_types=1);

namespace App\Portal\Resources;

use App\Models\DocumentRequest;
use App\Models\RequestItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

final class PortalViewResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        /** @var DocumentRequest $model */
        $model = $this->resource;

        $expiresAt = $model->getAttributeValue('expires_at');
        assert($expiresAt instanceof Carbon);

        $items = $model->items;

        return [
            'title' => $model->title,
            'status' => 'waiting',
            'uploaded' => 0,
            'total' => count($items),
            'lastActivityAt' => null,
            'expiresAt' => $expiresAt->toIso8601String(),
            'items' => array_map(static fn (RequestItem $item): array => [
                'id' => $item->getKey(),
                'label' => $item->label,
                'position' => $item->position,
                'state' => 'waiting',
                'file' => null,
            ], $items->all()),
        ];
    }
}
