<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Storage\StorageDeletionOutbox;
use Illuminate\Console\Command;

final class ProcessStorageDeletionOutbox extends Command
{
    protected $signature = 'storage:cleanup';

    protected $description = 'Retry pending private object deletions';

    public function handle(StorageDeletionOutbox $outbox): int
    {
        $processed = $outbox->processBatch();

        $this->info("Deleted {$processed} stored object(s).");

        return self::SUCCESS;
    }
}
