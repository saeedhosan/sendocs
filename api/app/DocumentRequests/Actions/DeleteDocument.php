<?php

declare(strict_types=1);

namespace App\DocumentRequests\Actions;

use App\Exceptions\ApiException;
use App\Models\DocumentRequest;
use App\Models\RequestItem;
use App\Storage\StorageDeletionOutbox;
use Illuminate\Support\Facades\DB;

final readonly class DeleteDocument
{
    public function __construct(
        private StorageDeletionOutbox $storageDeletionOutbox,
    ) {
    }

    public function execute(DocumentRequest $request, string $itemId): void
    {
        $request->loadMissing('items.document');

        /** @var RequestItem|null $item */
        $item = $request->items->first(
            static fn (RequestItem $item): bool => $item->getKey() === $itemId,
        );

        if ($item === null || $item->document === null) {
            throw new ApiException('not_found', 'Not found.', 404);
        }

        $storageKey = $item->document->storage_key;

        DB::transaction(function () use ($item, $storageKey): void {
            $this->storageDeletionOutbox->enqueue([$storageKey]);

            $item->document()->delete();
        });
    }
}
