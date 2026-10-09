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

        $items          = $model->items;
        $uploaded       = 0;
        $lastActivityAt = null;

        foreach ($items as $item) {
            $document = $item->document;

            if ($document === null) {
                continue;
            }

            $uploaded++;
            $uploadedAt = $document->getAttributeValue('uploaded_at');
            assert($uploadedAt instanceof Carbon);

            if (! $lastActivityAt instanceof Carbon || $uploadedAt->greaterThan($lastActivityAt)) {
                $lastActivityAt = $uploadedAt;
            }
        }

        return [
            'title'          => $model->title,
            'status'         => $uploaded === $items->count() ? 'complete' : 'waiting',
            'uploaded'       => $uploaded,
            'total'          => $items->count(),
            'lastActivityAt' => $lastActivityAt?->toIso8601String(),
            'expiresAt'      => $expiresAt->toIso8601String(),
            'items'          => array_map(static function (RequestItem $item): array {
                $document = $item->document;

                if ($document === null) {
                    return [
                        'id'       => $item->getKey(),
                        'label'    => $item->label,
                        'position' => $item->position,
                        'state'    => 'waiting',
                        'file'     => null,
                    ];
                }

                $uploadedAt = $document->getAttributeValue('uploaded_at');
                assert($uploadedAt instanceof Carbon);

                return [
                    'id'       => $item->getKey(),
                    'label'    => $item->label,
                    'position' => $item->position,
                    'state'    => 'uploaded',
                    'file'     => [
                        'originalName' => $document->original_name,
                        'sizeBytes'    => $document->size_bytes,
                        'uploadedAt'   => $uploadedAt->toIso8601String(),
                    ],
                ];
            }, $items->all()),
        ];
    }
}
