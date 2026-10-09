<?php

declare(strict_types=1);

namespace App\Storage;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

final class StorageDeletionOutbox
{
    /**
     * Record object keys in the caller's current database transaction.
     *
     * @param  list<string>  $storageKeys
     */
    public function enqueue(array $storageKeys): void
    {
        foreach (array_unique($storageKeys) as $storageKey) {
            DB::table('storage_deletion_outbox')->insertOrIgnore([
                'storage_key' => $storageKey,
                'created_at' => now(),
                'available_at' => now(),
            ]);
        }
    }

    /**
     * Attempt a bounded batch. Failed entries remain durable for the next run.
     */
    public function processBatch(): int
    {
        $entries = DB::table('storage_deletion_outbox')
            ->where('available_at', '<=', now())
            ->orderBy('available_at')
            ->orderBy('id')
            ->limit(100)
            ->get();

        $processed = 0;

        foreach ($entries as $entry) {
            try {
                if (! Storage::disk('s3')->delete($entry->storage_key)) {
                    throw new \RuntimeException('The stored object could not be deleted.');
                }

                DB::table('storage_deletion_outbox')
                    ->where('id', $entry->id)
                    ->delete();

                $processed++;
            } catch (Throwable $exception) {
                DB::table('storage_deletion_outbox')
                    ->where('id', $entry->id)
                    ->update([
                        'attempts' => DB::raw('attempts + 1'),
                        'last_attempted_at' => now(),
                        'available_at' => now()->addSeconds(min(3600, 60 * (2 ** min((int) $entry->attempts, 6)))),
                    ]);

                report($exception);
            }
        }

        return $processed;
    }
}
