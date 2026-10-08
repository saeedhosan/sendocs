<?php

declare(strict_types=1);

namespace App\DocumentRequests\Actions;

use App\Exceptions\ApiException;
use App\Models\DocumentRequest;
use App\Models\RequestItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

final readonly class DeleteDocument
{
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

        DB::transaction(static function () use ($item): void {
            $item->document()->delete();
        });

        try {
            Storage::disk('s3')->delete($storageKey);
        } catch (\Throwable $exception) {
            report($exception);
        }
    }
}
