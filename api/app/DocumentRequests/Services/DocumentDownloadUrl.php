<?php

declare(strict_types=1);

namespace App\DocumentRequests\Services;

use App\Models\Document;
use Illuminate\Support\Facades\Storage;

final class DocumentDownloadUrl
{
    private const int TTL_MINUTES = 5;

    public function for(Document $document): string
    {
        // S3-compatible storage signs URLs with the browser-reachable endpoint.
        // Local storage signs an application URL and must not initialize an S3 client.
        $disk = config('filesystems.default') === 's3'
            ? Storage::disk('s3-browser')
            : Storage::disk();

        return $disk->temporaryUrl(
            $document->storage_key,
            now()->addMinutes(self::TTL_MINUTES),
            [
                'ResponseContentDisposition' => 'attachment; filename="'.addcslashes($document->original_name, '\\\"').'"',
                'ResponseContentType'        => $document->mime_type,
            ],
        );
    }
}
