<?php

declare(strict_types=1);

namespace App\\DocumentRequests\\Actions;

use App\\Models\\DocumentRequest;
use App\\Models\\RequestItem;
use App\\Storage\\StorageDeletionOutbox;
use Illuminate\\Support\\Facades\\DB;

final readonly class DeleteRequest
{
    public function __construct(
        private StorageDeletionOutbox $storageDeletionOutbox,
    ) {
    }

    public function execute(DocumentRequest $request): void
    {
        $request->loadMissing('items.document');

        $storageKeys = $request->items
            ->map(static fn (RequestItem $item): ?string => $item->document?->storage_key)
            ->filter()
            ->values()
            ->all();

        DB::transaction(function () use ($request, $storageKeys): void {
            $this->storageDeletionOutbox->enqueue($storageKeys);

            $request->delete();
        });
    }
}
