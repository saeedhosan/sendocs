<?php

declare(strict_types=1);

use App\Auth\Services\CsrfTokenService;
use App\Auth\Services\SessionService;
use App\Models\DocumentRequest;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\TestResponse;

function makeDeleteDocumentRequest(User $owner, string $title, int $itemCount): DocumentRequest
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

function deleteDocumentRequest(User $owner, string $requestId, string $itemId): TestResponse
{
    $session = app(SessionService::class)->issue($owner);
    test()->withCredentials();
    useDevice(queuedSessionToken());

    return test()->deleteJson("/api/v1/requests/{$requestId}/items/{$itemId}/document", [], ['X-CSRF-Token' => app(CsrfTokenService::class)->derive($session->getKey())]);
}

test('deletes an uploaded document and returns no content', function (): void {
    Storage::fake('s3');

    $owner   = User::factory()->create();
    $request = makeDeleteDocumentRequest($owner, 'Tax Documents', 1);
    $item    = $request->items()->firstOrFail();
    Storage::disk('s3')->put('requests/file.pdf', 'pdf');
    $item->document()->create([
        'storage_key'   => 'requests/file.pdf',
        'original_name' => 'tax.pdf',
        'mime_type'     => 'application/pdf',
        'size_bytes'    => 3,
        'sha256'        => hash('sha256', 'pdf'),
        'uploaded_at'   => now(),
    ]);

    deleteDocumentRequest($owner, $request->getKey(), $item->getKey())
        ->assertNoContent();

    expect($item->fresh()->document)->toBeNull();
    test()->artisan('storage:cleanup')->assertExitCode(0);
    Storage::disk('s3')->assertMissing('requests/file.pdf');
});

test('returns 404 when the item belongs to another request', function (): void {
    $owner        = User::factory()->create();
    $otherOwner   = User::factory()->create();
    $request      = makeDeleteDocumentRequest($owner, 'Mine', 1);
    $otherRequest = makeDeleteDocumentRequest($otherOwner, 'Other', 1);
    $item         = $otherRequest->items()->firstOrFail();
    $item->document()->create([
        'storage_key'   => 'requests/other/file.pdf',
        'original_name' => 'other.pdf',
        'mime_type'     => 'application/pdf',
        'size_bytes'    => 3,
        'sha256'        => hash('sha256', 'pdf'),
        'uploaded_at'   => now(),
    ]);

    $otherRequestItemResponse = deleteDocumentRequest($owner, $request->getKey(), $item->getKey())
        ->assertNotFound()
        ->assertExactJson([
            'error' => [
                'code'    => 'not_found',
                'message' => 'Not found.',
            ],
        ]);

    $unknownItemResponse = deleteDocumentRequest(
        $owner,
        $request->getKey(),
        '00000000-0000-0000-0000-000000000000',
    )->assertNotFound()->assertExactJson([
        'error' => [
            'code'    => 'not_found',
            'message' => 'Not found.',
        ],
    ]);

    expect($otherRequestItemResponse->content())->toBe($unknownItemResponse->content());

    expect($item->fresh()->document)->not->toBeNull();
});

test('returns 404 when the item has no document', function (): void {
    $owner   = User::factory()->create();
    $request = makeDeleteDocumentRequest($owner, 'Tax Documents', 1);
    $item    = $request->items()->firstOrFail();

    deleteDocumentRequest($owner, $request->getKey(), $item->getKey())
        ->assertStatus(404)
        ->assertJsonPath('error.code', 'not_found');
});

test('requires csrf and authentication', function (): void {
    $owner   = User::factory()->create();
    $request = makeDeleteDocumentRequest($owner, 'Tax Documents', 1);
    $item    = $request->items()->firstOrFail();

    test()->deleteJson("/api/v1/requests/{$request->getKey()}/items/{$item->getKey()}/document")
        ->assertStatus(401);
});

test('rejects missing csrf token for an authenticated owner', function (): void {
    $owner   = User::factory()->create();
    $request = makeDeleteDocumentRequest($owner, 'Tax Documents', 1);
    $item    = $request->items()->firstOrFail();

    app(SessionService::class)->issue($owner);
    test()->withCredentials();
    useDevice(queuedSessionToken());

    test()->deleteJson("/api/v1/requests/{$request->getKey()}/items/{$item->getKey()}/document")
        ->assertStatus(403)
        ->assertJsonPath('error.code', 'csrf_failed');
});

test('rate limits document deletion', function (): void {
    $owner   = User::factory()->create();
    $request = makeDeleteDocumentRequest($owner, 'Tax Documents', 1);
    $item    = $request->items()->firstOrFail();

    $session = app(SessionService::class)->issue($owner);
    test()->withCredentials();
    useDevice(queuedSessionToken());
    test()->withHeader('X-CSRF-Token', app(CsrfTokenService::class)->derive($session->getKey()));

    for ($i = 0; $i < 120; $i++) {
        test()->deleteJson("/api/v1/requests/{$request->getKey()}/items/{$item->getKey()}/document")
            ->assertStatus(404);
    }

    test()->deleteJson("/api/v1/requests/{$request->getKey()}/items/{$item->getKey()}/document")
        ->assertStatus(429)
        ->assertJsonPath('error.code', 'rate_limited');
});
