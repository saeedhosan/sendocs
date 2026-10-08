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

        $uploaded = 0;
        $lastActivityAt = null;

        foreach ($items as $item) {
            $document = $item->document;

            if ($document === null) {
                continue;
            }

            $uploaded++;
            $uploadedAt = $document->getAttributeValue('uploaded_at');
            assert($uploadedAt instanceof Carbon);

            if ($lastActivityAt === null || $uploadedAt->greaterThan($lastActivityAt)) {
                $lastActivityAt = $uploadedAt;
            }
        }

        return [
            'id' => $model->getKey(),
            'title' => $model->title,
            'status' => $uploaded === $items->count() ? 'complete' : 'waiting',
            'uploaded' => $uploaded,
            'total' => $items->count(),
            'lastActivityAt' => $lastActivityAt?->toIso8601String(),
            'createdAt' => $createdAt->toIso8601String(),
            'expiresAt' => $expiresAt->toIso8601String(),
            'revokedAt' => $revokedAt?->toIso8601String(),
            'items' => array_map(static function (RequestItem $item): array {
                $document = $item->document;

                if ($document === null) {
                    return [
                        'id' => $item->getKey(),
                        'label' => $item->label,
                        'position' => $item->position,
                        'state' => 'waiting',
                        'document' => null,
                    ];
                }

                $uploadedAt = $document->getAttributeValue('uploaded_at');
                assert($uploadedAt instanceof Carbon);

                return [
                    'id' => $item->getKey(),
                    'label' => $item->label,
                    'position' => $item->position,
                    'state' => 'uploaded',
                    'document' => [
                        'id' => $document->getKey(),
                        'originalName' => $document->original_name,
                        'mimeType' => $document->mime_type,
                        'sizeBytes' => $document->size_bytes,
                        'uploadedAt' => $uploadedAt->toIso8601String(),
                        'downloadUrl' => null,
                    ],
                ];
            }, $items->all()),
        ];
    }
}
