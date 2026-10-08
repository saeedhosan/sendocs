<?php

declare(strict_types=1);

namespace App\DocumentRequests\Services;

use App\Models\Document;
use Illuminate\Support\Facades\Storage;

final class DocumentDownloadUrl
{
    private const TTL_MINUTES = 5;

    public function for(Document $document): string
    {
        return Storage::disk('s3')->temporaryUrl(
            $document->storage_key,
            now()->addMinutes(self::TTL_MINUTES),
            [
                'ResponseContentDisposition' => 'attachment; filename="'.addcslashes($document->original_name, "\\\"").'"',
                'ResponseContentType' => $document->mime_type,
            ],
        );
    }
}
