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
            'id'             => $model->getKey(),
            'title'          => $model->title,
            'status'         => $uploaded === $items->count() ? 'complete' : 'waiting',
            'uploaded'       => $uploaded,
            'total'          => $items->count(),
            'lastActivityAt' => $lastActivityAt?->toIso8601String(),
            'createdAt'      => $createdAt->toIso8601String(),
            'expiresAt'      => $expiresAt->toIso8601String(),
            'revokedAt'      => $revokedAt?->toIso8601String(),
        ];
    }
}
