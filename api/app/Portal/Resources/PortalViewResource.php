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
        $uploaded = $items->filter(static fn (RequestItem $item): bool => $item->document !== null)->count();
        $lastActivityAt = $items
            ->map(fn (RequestItem $item) => $item->document?->uploaded_at)
            ->filter()
            ->max();

        return [
            'title' => $model->title,
            'status' => $uploaded === $items->count() ? 'complete' : 'waiting',
            'uploaded' => $uploaded,
            'total' => $items->count(),
            'lastActivityAt' => $lastActivityAt instanceof Carbon ? $lastActivityAt->toIso8601String() : null,
            'expiresAt' => $expiresAt->toIso8601String(),
            'items' => array_map(static fn (RequestItem $item): array => [
                'id' => $item->getKey(),
                'label' => $item->label,
                'position' => $item->position,
                'state' => $item->document !== null ? 'uploaded' : 'waiting',
                'file' => $item->document === null ? null : [
                    'originalName' => $item->document->original_name,
                    'sizeBytes' => $item->document->size_bytes,
                    'uploadedAt' => $item->document->uploaded_at->toIso8601String(),
                ],
            ], $items->all()),
        ];
    }
}
