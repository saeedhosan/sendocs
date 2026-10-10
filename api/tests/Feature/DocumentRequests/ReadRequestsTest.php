<?php

declare(strict_types=1);

use App\Auth\Services\SessionService;
use App\Models\DocumentRequest;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\TestResponse;

function makeDocumentRequest(User $owner, string $title, int $items = 1, ?DateTimeInterface $createdAt = null): DocumentRequest
{
    $request = new DocumentRequest([
        'owner_id'   => $owner->getKey(),
        'title'      => $title,
        'token_hash' => hash('sha256', bin2hex(random_bytes(32))),
        'expires_at' => now()->addDays(14),
    ]);

    if ($createdAt instanceof DateTimeInterface) {
        $request->created_at = $createdAt;
    }

    $request->save();

    foreach (range(1, $items) as $position) {
        $request->items()->create([
            'label'    => "Item {$position}",
            'position' => $position,
        ]);
    }

    return $request;
}

function readRequestsAsOwner(User $owner, array $query = []): TestResponse
{
    app(SessionService::class)->issue($owner);
    test()->withCredentials();
    useDevice(queuedSessionToken());

    return test()->getJson('/api/v1/requests'.($query === [] ? '' : '?'.http_build_query($query)));
}

test('requires an authenticated owner', function (): void {
    test()->getJson('/api/v1/requests')
        ->assertStatus(401)
        ->assertJsonPath('error.code', 'unauthenticated');
});

test('lists only the current owner requests in newest-first order', function (): void {
    $owner = User::factory()->create();
    $other = User::factory()->create();

    makeDocumentRequest($owner, 'Older request', 2, now()->subMinute());
    makeDocumentRequest($owner, 'Newest request', 1, now());
    makeDocumentRequest($other, 'Other owner');

    $response = readRequestsAsOwner($owner);

    $response->assertOk()
        ->assertJsonPath('data.0.title', 'Newest request')
        ->assertJsonPath('data.0.uploaded', 0)
        ->assertJsonPath('data.0.total', 1)
        ->assertJsonPath('data.1.title', 'Older request')
        ->assertJsonPath('data.1.total', 2)
        ->assertJsonPath('nextCursor', null);

    expect($response->json('data'))->toHaveCount(2);
});

test('supports cursor pagination with the published page size limits', function (): void {
    $owner = User::factory()->create();

    foreach (range(1, 3) as $number) {
        makeDocumentRequest($owner, "Request {$number}", 1, now()->subSeconds($number));
    }

    $first = readRequestsAsOwner($owner, ['limit' => 2]);

    $first->assertOk()->assertJsonCount(2, 'data');

    $cursor = $first->json('nextCursor');
    expect($cursor)->toBeString()->not->toBe('');

    $second = readRequestsAsOwner($owner, ['limit' => 2, 'cursor' => $cursor]);

    $second->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('nextCursor', null);
});

test('validates list pagination inputs', function (): void {
    $owner = User::factory()->create();

    readRequestsAsOwner($owner, ['limit' => 0])->assertStatus(422);
    readRequestsAsOwner($owner, ['limit' => 101])->assertStatus(422);
    readRequestsAsOwner($owner, ['limit' => 'abc'])->assertStatus(422);
    readRequestsAsOwner($owner, ['cursor' => 'not-a-valid-cursor'])
        ->assertStatus(422)
        ->assertJsonPath('error.code', 'validation_failed');
});

test('shows a request with its ordered items', function (): void {
    $owner   = User::factory()->create();
    $request = makeDocumentRequest($owner, 'Tax Documents', 2);

    app(SessionService::class)->issue($owner);
    test()->withCredentials();
    useDevice(queuedSessionToken());

    test()->getJson("/api/v1/requests/{$request->getKey()}")
        ->assertOk()
        ->assertJsonPath('id', $request->getKey())
        ->assertJsonPath('title', 'Tax Documents')
        ->assertJsonPath('status', 'waiting')
        ->assertJsonPath('uploaded', 0)
        ->assertJsonPath('total', 2)
        ->assertJsonPath('items.0.position', 1)
        ->assertJsonPath('items.1.position', 2)
        ->assertJsonPath('items.0.state', 'waiting')
        ->assertJsonPath('items.0.document', null);
});

test('does not reveal another owners request', function (): void {
    $owner   = User::factory()->create();
    $other   = User::factory()->create();
    $request = makeDocumentRequest($other, 'Private request');

    app(SessionService::class)->issue($owner);
    test()->withCredentials();
    useDevice(queuedSessionToken());

    $otherOwnerResponse = test()->getJson("/api/v1/requests/{$request->getKey()}")
        ->assertNotFound()
        ->assertExactJson([
            'error' => [
                'code'    => 'not_found',
                'message' => 'Not found.',
            ],
        ]);

    $unknownRequestResponse = test()->getJson('/api/v1/requests/00000000-0000-0000-0000-000000000000')
        ->assertNotFound()
        ->assertExactJson([
            'error' => [
                'code'    => 'not_found',
                'message' => 'Not found.',
            ],
        ]);

    expect($otherOwnerResponse->content())->toBe($unknownRequestResponse->content());
});

test('returns not found for an unknown request', function (): void {
    $owner = User::factory()->create();

    app(SessionService::class)->issue($owner);
    test()->withCredentials();
    useDevice(queuedSessionToken());

    test()->getJson('/api/v1/requests/00000000-0000-0000-0000-000000000000')
        ->assertNotFound()
        ->assertJsonPath('error.code', 'not_found');
});

test('includes a signed download URL for uploaded documents', function (): void {
    $owner   = User::factory()->create();
    $request = makeDocumentRequest($owner, 'Tax Documents', 1);
    $item    = $request->items()->firstOrFail();

    $item->document()->create([
        'storage_key'   => 'requests/'.$request->getKey().'/document.pdf',
        'original_name' => 'tax-2026.pdf',
        'mime_type'     => 'application/pdf',
        'size_bytes'    => 1024,
        'sha256'        => hash('sha256', 'pdf'),
        'uploaded_at'   => now(),
    ]);

    $disk = Mockery::mock();
    $disk->shouldReceive('temporaryUrl')
        ->once()
        ->andReturn('https://storage.example.test/signed');

    Storage::shouldReceive('disk')
        ->once()
        ->with('s3')
        ->andReturn($disk);

    app(SessionService::class)->issue($owner);
    test()->withCredentials();
    useDevice(queuedSessionToken());

    test()->getJson("/api/v1/requests/{$request->getKey()}")
        ->assertOk()
        ->assertJsonPath('items.0.document.downloadUrl', 'https://storage.example.test/signed');
});
