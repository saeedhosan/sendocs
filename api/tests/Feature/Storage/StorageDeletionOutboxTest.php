<?php

declare(strict_types=1);

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

test('deletes pending storage objects and removes completed outbox entries', function (): void {
    Storage::fake('s3');
    Storage::disk('s3')->put('requests/pending.pdf', 'pdf');

    DB::table('storage_deletion_outbox')->insert([
        'storage_key' => 'requests/pending.pdf',
        'created_at' => now(),
    ]);

    test()->artisan('storage:cleanup')->assertExitCode(0);

    Storage::disk('s3')->assertMissing('requests/pending.pdf');
    expect(DB::table('storage_deletion_outbox')->count())->toBe(0);
});

test('keeps failed storage deletions queued for a later retry', function (): void {
    $key = 'requests/retry.pdf';
    DB::table('storage_deletion_outbox')->insert([
        'storage_key' => $key,
        'created_at' => now(),
    ]);

    $disk = Mockery::mock();
    $disk->shouldReceive('delete')->once()->with($key)->andThrow(new RuntimeException('Storage unavailable.'));
    Storage::shouldReceive('disk')->once()->with('s3')->andReturn($disk);

    test()->artisan('storage:cleanup')->assertExitCode(0);

    $entry = DB::table('storage_deletion_outbox')->where('storage_key', $key)->first();

    expect($entry)->not->toBeNull()
        ->and($entry->attempts)->toBe(1)
        ->and($entry->last_attempted_at)->not->toBeNull();
});
