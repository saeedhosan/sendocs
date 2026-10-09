<?php

declare(strict_types=1);

namespace App\DocumentRequests\Actions;

use App\DocumentRequests\Services\DocumentTypeDetector;
use App\Exceptions\ApiException;
use App\Models\Document;
use App\Models\DocumentRequest;
use App\Models\RequestItem;
use App\Storage\StorageDeletionOutbox;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

final readonly class UploadDocument
{
    private const MAX_FILE_SIZE = 25 * 1024 * 1024;

    public function __construct(
        private DocumentTypeDetector $typeDetector,
        private StorageDeletionOutbox $storageDeletionOutbox,
    ) {}

    public function handle(DocumentRequest $portalRequest, string $itemId, ?UploadedFile $file): void
    {
        if ($file instanceof UploadedFile && in_array($file->getError(), [
            UPLOAD_ERR_INI_SIZE,
            UPLOAD_ERR_FORM_SIZE,
        ], true)) {
            throw new ApiException(
                'file_too_large',
                'The file is larger than 25 MB.',
                413,
            );
        }

        if (! $file instanceof UploadedFile || ! $file->isValid()) {
            throw ApiException::validationFailed([
                'file' => ['A file is required.'],
            ]);
        }

        $size = $file->getSize();

        if (! is_int($size) || $size > self::MAX_FILE_SIZE) {
            throw new ApiException(
                'file_too_large',
                'The file is larger than 25 MB.',
                413,
            );
        }

        $portalRequest->loadMissing('items');
        $item = $portalRequest->items->first(
            static fn (RequestItem $requestItem): bool => $requestItem->getKey() === $itemId,
        );

        if ($item === null) {
            throw new ApiException('not_found', 'Not found.', 404);
        }

        $detected = $this->typeDetector->detect($file);

        if ($detected === null) {
            throw new ApiException(
                'unsupported_type',
                'That file type is not accepted.',
                415,
            );
        }

        $storageKey = $portalRequest->getKey().'/'.Str::random(64);
        $stored     = null;

        try {
            $storedKey = Storage::disk('s3')->putFileAs(
                $portalRequest->getKey(),
                $file,
                basename($storageKey),
            );

            if (! is_string($storedKey) || $storedKey === '') {
                throw new RuntimeException('The document could not be stored.');
            }

            $stored = $storedKey;

            $realPath = $file->getRealPath();

            if (! is_string($realPath)) {
                throw new RuntimeException('The uploaded file path is unavailable.');
            }

            $sha256 = hash_file('sha256', $realPath);

            if (! is_string($sha256)) {
                throw new RuntimeException('The document hash could not be calculated.');
            }

            $document = new Document([
                'request_item_id' => $item->getKey(),
                'storage_key'     => $stored,
                'original_name'   => $this->sanitizeOriginalName($file->getClientOriginalName()),
                'mime_type'       => $detected['mimeType'],
                'size_bytes'      => $size,
                'sha256'          => $sha256,
                'uploaded_at'     => now(),
            ]);

            $document->save();
        } catch (UniqueConstraintViolationException $exception) {
            $this->deleteStoredFile($stored);

            throw new ApiException(
                'duplicate_upload',
                'A file has already been uploaded for this item.',
                409,
                previous: $exception,
            );
        } catch (Throwable $exception) {
            $this->deleteStoredFile($stored);

            throw new ApiException(
                'internal_error',
                'Something went wrong. Try again.',
                500,
                previous: $exception,
            );
        }
    }

    private function sanitizeOriginalName(string $name): string
    {
        $name = str_replace('\\', '/', $name);
        $name = basename($name);
        $name = trim($name);

        return Str::substr($name === '' ? 'file' : $name, 0, 255);
    }

    private function deleteStoredFile(?string $storageKey): void
    {
        if ($storageKey === null) {
            return;
        }

        try {
            if (Storage::disk('s3')->delete($storageKey)) {
                return;
            }
        } catch (Throwable $throwable) {
            report($throwable);
        }

        try {
            $this->storageDeletionOutbox->enqueue([$storageKey]);
        } catch (Throwable $throwable) {
            report($throwable);
        }
    }
}
