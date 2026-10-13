<?php

declare(strict_types=1);

use App\Auth\Services\CsrfTokenService;
use App\Auth\Services\SessionService;
use App\DocumentRequests\Actions\DeleteRequest;
use App\DocumentRequests\Actions\ShowRequest;
use App\Models\DocumentRequest;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\TestResponse;

function makeDeleteRequest(User $owner, string $title, int $itemCount): DocumentRequest
{
    $request = DocumentRequest::create([
        'owner_id'   => $owner->getKey(),
        'title'      => $title,
        'token_hash' => hash('sha256', uniqid('', true)),
        'expires_at' => now()->addDays(14),
    ]);

    for ($position = 1; $position <= $itemCount; $position++) {
        $request->items()->create([
            'label'    => "Document {$position}",
            'position' => $position,
        ]);
    }

    return $request->load('items');
}

function deleteRequest(User $owner, string $requestId): TestResponse
{
    $session = app(SessionService::class)->issue($owner);
    test()->withCredentials();
    useDevice(queuedSessionToken());

    return test()->deleteJson(
        "/api/v1/requests/{$requestId}",
        [],
        ['X-CSRF-Token' => app(CsrfTokenService::class)->derive($session->getKey())],
    );
}

function addDeleteRequestDocument($item, string $storageKey): void
{
    Storage::put($storageKey, 'pdf');

    $item->document()->create([
        'storage_key'   => $storageKey,
        'original_name' => basename($storageKey),
        'mime_type'     => 'application/pdf',
        'size_bytes'    => 3,
        'sha256'        => hash('sha256', 'pdf'),
        'uploaded_at'   => now(),
    ]);
}

test('deletes a request, its items, documents, and stored files', function (): void {
    Storage::fake();

    $owner   = User::factory()->create();
    $request = makeDeleteRequest($owner, 'Tax Documents', 3);

    foreach ($request->items as $index => $item) {
        addDeleteRequestDocument($item, "requests/{$request->getKey()}/file-{$index}.pdf");
    }

    deleteRequest($owner, $request->getKey())
        ->assertNoContent();

    expect(DocumentRequest::query()->find($request->getKey()))->toBeNull();
    expect($request->items()->count())->toBe(0);

    foreach ($request->items as $item) {
        expect($item->document)->toBeNull();
    }

    test()->artisan('storage:cleanup')->assertExitCode(0);

    foreach ($request->items as $index => $item) {
        Storage::assertMissing("requests/{$request->getKey()}/file-{$index}.pdf");
    }
});

test('queues a document created after the request was loaded', function (): void {
    Storage::fake();

    $owner         = User::factory()->create();
    $request       = makeDeleteRequest($owner, 'Tax Documents', 1);
    $loadedRequest = app(ShowRequest::class)->handle($owner, (string) $request->getKey());
    $item          = $request->items()->firstOrFail();
    $storageKey    = "requests/{$request->getKey()}/late-upload.pdf";
    addDeleteRequestDocument($item, $storageKey);

    app(DeleteRequest::class)->execute($loadedRequest);

    test()->artisan('storage:cleanup')->assertExitCode(0);
    Storage::assertMissing($storageKey);
});

test('returns 404 for another owners request and preserves it', function (): void {
    Storage::fake();

    $owner      = User::factory()->create();
    $otherOwner = User::factory()->create();
    $request    = makeDeleteRequest($otherOwner, 'Other Documents', 1);
    $item       = $request->items()->firstOrFail();
    addDeleteRequestDocument($item, "requests/{$request->getKey()}/file.pdf");

    $otherOwnerResponse = deleteRequest($owner, $request->getKey())
        ->assertNotFound()
        ->assertExactJson([
            'error' => [
                'code'    => 'not_found',
                'message' => 'Not found.',
            ],
        ]);

    $unknownRequestResponse = deleteRequest(
        $owner,
        '00000000-0000-0000-0000-000000000000',
    )->assertNotFound()->assertExactJson([
        'error' => [
            'code'    => 'not_found',
            'message' => 'Not found.',
        ],
    ]);

    expect($otherOwnerResponse->content())->toBe($unknownRequestResponse->content());

    expect($request->fresh())->not->toBeNull();
    expect($item->fresh()->document)->not->toBeNull();
    Storage::assertExists("requests/{$request->getKey()}/file.pdf");
});

test('returns 404 for an unknown request', function (): void {
    $owner = User::factory()->create();

    deleteRequest($owner, (string) str()->uuid())
        ->assertStatus(404)
        ->assertJsonPath('error.code', 'not_found');
});

test('requires authentication and csrf', function (): void {
    $owner   = User::factory()->create();
    $request = makeDeleteRequest($owner, 'Tax Documents', 1);

    test()->deleteJson("/api/v1/requests/{$request->getKey()}")
        ->assertStatus(401);

    app(SessionService::class)->issue($owner);
    test()->withCredentials();
    useDevice(queuedSessionToken());

    test()->deleteJson("/api/v1/requests/{$request->getKey()}")
        ->assertStatus(403)
        ->assertJsonPath('error.code', 'csrf_failed');
});

test('rate limits request deletion', function (): void {
    $owner   = User::factory()->create();
    $request = makeDeleteRequest($owner, 'Tax Documents', 1);

    $session = app(SessionService::class)->issue($owner);
    test()->withCredentials();
    useDevice(queuedSessionToken());
    test()->withHeader('X-CSRF-Token', app(CsrfTokenService::class)->derive($session->getKey()));

    for ($i = 0; $i < 120; $i++) {
        test()->deleteJson("/api/v1/requests/{$request->getKey()}")
            ->assertStatus(204);
        $request = makeDeleteRequest($owner, "Tax Documents {$i}", 1);
    }

    test()->deleteJson("/api/v1/requests/{$request->getKey()}")
        ->assertStatus(429)
        ->assertJsonPath('error.code', 'rate_limited');
});
