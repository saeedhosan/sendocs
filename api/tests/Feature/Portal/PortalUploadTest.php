<?php

declare(strict_types=1);

use App\Models\Document;
use App\Models\DocumentRequest;
use App\Models\RequestItem;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

function portalUploadFixture(): array
{
    $token = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
    $owner = User::factory()->create();

    $request = DocumentRequest::create([
        'owner_id' => $owner->getKey(),
        'title' => 'Tax Documents',
        'token_hash' => hash('sha256', $token),
        'expires_at' => now()->addDays(14),
    ]);

    $items = $request->items()->createMany([
        ['label' => 'Passport', 'position' => 1],
        ['label' => 'Bank Statement', 'position' => 2],
    ]);

    return [$request, $items, $token];
}

function uploadPortal(string $token, string $itemId, UploadedFile $file)
{
    return test()->post(
        "/api/v1/portal/{$token}/items/{$itemId}/file",
        ['file' => $file],
    );
}

function validPdf(string $name = 'document.pdf'): UploadedFile
{
    return UploadedFile::fake()->createWithContent(
        $name,
        "%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n",
    );
}

beforeEach(function (): void {
    Storage::fake('s3');
});

test('uploads one file and returns the updated portal view', function (): void {
    [$request, $items, $token] = portalUploadFixture();

    $response = uploadPortal($token, $items[0]->getKey(), validPdf('passport.pdf'));

    $response
        ->assertOk()
        ->assertJsonPath('status', 'waiting')
        ->assertJsonPath('uploaded', 1)
        ->assertJsonPath('total', 2)
        ->assertJsonPath('items.0.state', 'uploaded')
        ->assertJsonPath('items.0.file.originalName', 'passport.pdf')
        ->assertJsonPath('items.0.file.sizeBytes', strlen("%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n"))
        ->assertJsonPath('items.1.state', 'waiting')
        ->assertJsonPath('items.1.file', null);

    $document = Document::query()->where('request_item_id', $items[0]->getKey())->firstOrFail();

    expect($document->storage_key)
        ->toStartWith($request->getKey().'/')
        ->and($document->sha256)
        ->toBe(hash('sha256', Storage::disk('s3')->get($document->storage_key)));
});

test('rejects a second upload for the same item and keeps the first file', function (): void {
    [$request, $items, $token] = portalUploadFixture();

    uploadPortal($token, $items[0]->getKey(), validPdf('first.pdf'))->assertOk();

    uploadPortal($token, $items[0]->getKey(), validPdf('second.pdf'))
        ->assertStatus(409)
        ->assertExactJson([
            'error' => [
                'code' => 'duplicate_upload',
                'message' => 'A file has already been uploaded for this item.',
            ],
        ]);

    expect(Document::query()->where('request_item_id', $items[0]->getKey())->count())->toBe(1);
    Storage::disk('s3')->assertCount($request->getKey(), 1);
});

test('returns 404 when the item is not on the resolved request', function (): void {
    [$request, $items, $token] = portalUploadFixture();

    $otherRequest = DocumentRequest::create([
        'owner_id' => $request->owner_id,
        'title' => 'Other',
        'token_hash' => hash('sha256', rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=')),
        'expires_at' => now()->addDays(14),
    ]);
    $otherItem = $otherRequest->items()->create([
        'label' => 'Other file',
        'position' => 1,
    ]);

    uploadPortal($token, $otherItem->getKey(), validPdf())
        ->assertStatus(404)
        ->assertExactJson([
            'error' => [
                'code' => 'not_found',
                'message' => 'Not found.',
            ],
        ]);

    expect(Document::query()->count())->toBe(0);
});

test('rejects a file over the 25 MB cap', function (): void {
    [, $items, $token] = portalUploadFixture();

    $file = UploadedFile::fake()->create(
        'large.pdf',
        25 * 1024 + 1,
        'application/pdf',
    );

    uploadPortal($token, $items[0]->getKey(), $file)
        ->assertStatus(413)
        ->assertExactJson([
            'error' => [
                'code' => 'file_too_large',
                'message' => 'The file is larger than 25 MB.',
            ],
        ]);

    expect(Document::query()->count())->toBe(0);
    Storage::disk('s3')->assertEmpty();
});

test('accepts a file at the 25 MB cap', function (): void {
    [, $items, $token] = portalUploadFixture();

    $file = UploadedFile::fake()->create(
        'large.pdf',
        25 * 1024,
        'application/pdf',
    );

    uploadPortal($token, $items[0]->getKey(), $file)->assertOk();

    expect(Document::query()->count())->toBe(1);
});

test('rejects a renamed file when its content type disagrees with its extension', function (): void {
    [, $items, $token] = portalUploadFixture();

    uploadPortal(
        $token,
        $items[0]->getKey(),
        validPdf('passport.txt'),
    )
        ->assertStatus(415)
        ->assertExactJson([
            'error' => [
                'code' => 'unsupported_type',
                'message' => 'That file type is not accepted.',
            ],
        ]);

    expect(Document::query()->count())->toBe(0);
    Storage::disk('s3')->assertEmpty();
});

test('returns the same invalid link response for upload requests', function (): void {
    [, $items, $token] = portalUploadFixture();

    $expiredRequest = DocumentRequest::query()
        ->where('token_hash', hash('sha256', $token))
        ->firstOrFail();

    $expiredRequest->update(['expires_at' => now()->subMinute()]);

    uploadPortal($token, $items[0]->getKey(), validPdf())
        ->assertStatus(410)
        ->assertExactJson([
            'error' => [
                'code' => 'invalid_link',
                'message' => 'This link is no longer valid.',
            ],
        ]);
});

test('does not require a csrf token or create a session cookie', function (): void {
    [, $items, $token] = portalUploadFixture();

    uploadPortal($token, $items[0]->getKey(), validPdf())
        ->assertOk()
        ->assertCookieMissing(config('session.owner_cookie.name'));
});

test('rate limits uploads to 30 attempts per hour per ip', function (): void {
    [, $items, $token] = portalUploadFixture();

    for ($i = 0; $i < 30; $i++) {
        test()->post(
            "/api/v1/portal/{$token}/items/{$items[0]->getKey()}/file",
        )->assertStatus(422);
    }

    test()->post(
        "/api/v1/portal/{$token}/items/{$items[0]->getKey()}/file",
    )
        ->assertStatus(429)
        ->assertJsonPath('error.code', 'rate_limited');
});
