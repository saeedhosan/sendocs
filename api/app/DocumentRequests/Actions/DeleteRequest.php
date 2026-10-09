<?php

declare(strict_types=1);

namespace App\DocumentRequests\Actions;

use App\Models\DocumentRequest;
use App\Models\RequestItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

final readonly class DeleteRequest
{
    public function execute(DocumentRequest $request): void
    {
        $request->loadMissing('items.document');

        $storageKeys = $request->items
            ->map(static fn (RequestItem $item): ?string => $item->document?->storage_key)
            ->filter()
            ->values()
            ->all();

        DB::transaction(static function () use ($request): void {
            //we will add more delete operations 
            $request->delete();
        });

        foreach ($storageKeys as $storageKey) {
            try {
                Storage::disk('s3')->delete($storageKey);
            } catch (\Throwable $exception) {
                report($exception);
            }
        }
    }
}
