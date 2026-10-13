<?php

declare(strict_types=1);

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

test('deletes pending storage objects and removes completed outbox entries', function (): void {
    Storage::fake();
    Storage::put('requests/pending.pdf', 'pdf');

    DB::table('storage_deletion_outbox')->insert([
        'storage_key' => 'requests/pending.pdf',
        'created_at'  => now(),
    ]);

    test()->artisan('storage:cleanup')->assertExitCode(0);

    Storage::assertMissing('requests/pending.pdf');
    expect(DB::table('storage_deletion_outbox')->count())->toBe(0);
});

test('keeps failed storage deletions queued for a later retry', function (): void {
    $key = 'requests/retry.pdf';
    DB::table('storage_deletion_outbox')->insert([
        'storage_key' => $key,
        'created_at'  => now(),
    ]);

    Storage::shouldReceive('delete')->once()->with($key)->andThrow(new RuntimeException('Storage unavailable.'));

    test()->artisan('storage:cleanup')->assertExitCode(0);

    $entry = DB::table('storage_deletion_outbox')->where('storage_key', $key)->first();

    expect($entry)->not->toBeNull()
        ->and($entry->attempts)->toBe(1)
        ->and($entry->last_attempted_at)->not->toBeNull();
});

test('defers failed storage deletions until their retry time', function (): void {
    Storage::fake();

    $now = now()->startOfSecond();
    Carbon::setTestNow($now);

    try {
        DB::table('storage_deletion_outbox')->insert([
            'storage_key'  => 'requests/not-yet-due.pdf',
            'created_at'   => now(),
            'available_at' => now()->addMinute(),
        ]);

        test()->artisan('storage:cleanup')->assertExitCode(0);

        expect(DB::table('storage_deletion_outbox')->count())->toBe(1);
        Storage::assertMissing('requests/not-yet-due.pdf');
    } finally {
        Carbon::setTestNow();
    }
});

test('caps storage deletion retry backoff at one hour', function (): void {
    $now = now()->startOfSecond();
    Carbon::setTestNow($now);

    try {
        $key = 'requests/retry-cap.pdf';

        DB::table('storage_deletion_outbox')->insert([
            'storage_key'  => $key,
            'attempts'     => 6,
            'created_at'   => now(),
            'available_at' => now(),
        ]);

        Storage::shouldReceive('delete')->once()->with($key)
            ->andThrow(new RuntimeException('Storage unavailable.'));

        test()->artisan('storage:cleanup')->assertExitCode(0);

        $entry = DB::table('storage_deletion_outbox')->where('storage_key', $key)->first();

        expect($entry->attempts)->toBe(7)
            ->and(Carbon::parse($entry->available_at)->timestamp)
            ->toBe($now->copy()->addHour()->timestamp);
    } finally {
        Carbon::setTestNow();
    }
});
