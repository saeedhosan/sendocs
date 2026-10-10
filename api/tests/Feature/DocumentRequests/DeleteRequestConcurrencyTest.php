<?php

declare(strict_types=1);

use App\DocumentRequests\Actions\DeleteRequest;
use App\Models\DocumentRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

test('queues documents added after the request relation was loaded', function (): void {
    Storage::fake('s3');

    $owner = User::factory()->create();
    $request = DocumentRequest::create([
        'owner_id'   => $owner->getKey(),
        'title'      => 'Tax Documents',
        'token_hash' => hash('sha256', bin2hex(random_bytes(32))),
        'expires_at' => now()->addDays(14),
    ]);
    $item = $request->items()->create([
        'label'    => 'Passport',
        'position' => 1,
    ]);

    // Simulate the request snapshot loaded by the controller before an upload
    // commits its document metadata.
    $request->load('items.document');

    $storageKey = "requests/{$request->getKey()}/passport.pdf";
    Storage::disk('s3')->put($storageKey, 'pdf');

    $item->document()->create([
        'storage_key'   => $storageKey,
        'original_name' => 'passport.pdf',
        'mime_type'     => 'application/pdf',
        'size_bytes'    => 3,
        'sha256'        => hash('sha256', 'pdf'),
        'uploaded_at'   => now(),
    ]);

    app(DeleteRequest::class)->execute($request);

    expect(DB::table('storage_deletion_outbox')
        ->where('storage_key', $storageKey)
        ->exists())->toBeTrue();

    test()->artisan('storage:cleanup')->assertExitCode(0);

    Storage::disk('s3')->assertMissing($storageKey);
    expect(DocumentRequest::query()->find($request->getKey()))->toBeNull();
});
