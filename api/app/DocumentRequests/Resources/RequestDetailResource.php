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

        $documents = $items
            ->map(fn (RequestItem $item) => $item->document)
            ->filter()
            ->values();

        $uploaded = $documents->count();
        $lastActivityAt = $documents->max(
            fn ($document) => $document->getAttributeValue('uploaded_at'),
        );

        return [
            'id' => $model->getKey(),
            'title' => $model->title,
            'status' => $uploaded === $items->count() ? 'complete' : 'waiting',
            'uploaded' => $uploaded,
            'total' => count($items),
            'lastActivityAt' => $lastActivityAt instanceof Carbon ? $lastActivityAt->toIso8601String() : null,
            'createdAt' => $createdAt->toIso8601String(),
            'expiresAt' => $expiresAt->toIso8601String(),
            'revokedAt' => $revokedAt?->toIso8601String(),
            'items' => array_map(static fn (RequestItem $item): array => [
                'id' => $item->getKey(),
                'label' => $item->label,
                'position' => $item->position,
                'state' => $item->document !== null ? 'uploaded' : 'waiting',
                'document' => $item->document === null ? null : [
                    'id' => $item->document->getKey(),
                    'originalName' => $item->document->original_name,
                    'mimeType' => $item->document->mime_type,
                    'sizeBytes' => $item->document->size_bytes,
                    'uploadedAt' => $item->document->uploaded_at->toIso8601String(),
                    'downloadUrl' => null,
                ],
            ], $items->all()),
        ];
    }
}
