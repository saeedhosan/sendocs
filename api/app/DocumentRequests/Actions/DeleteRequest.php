<?php

declare(strict_types=1);

namespace App\DocumentRequests\Actions;

use App\Models\DocumentRequest;
use App\Models\RequestItem;
use App\Storage\StorageDeletionOutbox;
use Illuminate\Support\Facades\DB;

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
                ->lockForUpdate()
                ->first();

            if (! $lockedRequest instanceof DocumentRequest) {
                return;
            }

            // Lock item rows before reading documents. A concurrent upload must
            // finish its foreign-key check first, or fail after this delete.
            $items = RequestItem::query()
                ->where('request_id', $lockedRequest->getKey())
                ->orderBy('id')
                ->lockForUpdate()
                ->with('document')
                ->get();

            $storageKeys = $items
                ->map(static fn (RequestItem $item): ?string => $item->document?->storage_key)
                ->filter()
                ->values()
                ->all();

            $this->storageDeletionOutbox->enqueue($storageKeys);

            $lockedRequest->delete();
        });
    }
}
