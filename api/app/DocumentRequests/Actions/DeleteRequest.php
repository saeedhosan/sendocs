<?php

declare(strict_types=1);

namespace App\\DocumentRequests\\Actions;

use App\\Exceptions\\ApiException;
use App\\Models\\Document;
use App\\Models\\DocumentRequest;
use App\\Models\\RequestItem;
use App\\Storage\\StorageDeletionOutbox;
use Illuminate\\Support\\Facades\\DB;

final readonly class DeleteRequest
{
    public function __construct(
        private StorageDeletionOutbox $storageDeletionOutbox,
    ) {}

    public function execute(DocumentRequest $request): void
    {
        DB::transaction(function () use ($request): void {
            $lockedRequest = DocumentRequest::query()
                ->whereKey($request->getKey())
                ->where('owner_id', $request->owner_id)
                ->lockForUpdate()
                ->first();

            if ($lockedRequest === null) {
                throw new ApiException('not_found', 'Not found.', 404);
            }

            // Lock the child rows before reading document keys. Uploads must hold
            // a foreign-key lock on these rows when inserting document metadata,
            // so a racing upload either commits before this read or fails after
            // the request is deleted.
            $items = RequestItem::query()
                ->where('request_id', $lockedRequest->getKey())
                ->orderBy('position')
                ->lockForUpdate()
                ->get();

            $storageKeys = Document::query()
                ->whereIn('request_item_id', $items->modelKeys())
                ->pluck('storage_key')
                ->all();

            $this->storageDeletionOutbox->enqueue($storageKeys);

            $lockedRequest->delete();
        });
    }
}
