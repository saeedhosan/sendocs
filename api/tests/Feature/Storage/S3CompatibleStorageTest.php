<?php

declare(strict_types=1);

use App\DocumentRequests\Services\DocumentDownloadUrl;
use App\Models\Document;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

test('stores and deletes private objects and creates a five-minute signed download URL', function (): void {
    if (env('OBJECT_STORAGE_INTEGRATION') !== 'true') {
        $this->markTestSkipped('Set OBJECT_STORAGE_INTEGRATION=true to run against a live S3-compatible endpoint.');
    }

    $disk = Storage::disk('s3');
    $key  = 'integration-tests/'.Str::uuid().'.txt';
    $body = 'private object storage integration check';

    try {
        expect($disk->put($key, $body))->toBeTrue()
            ->and($disk->exists($key))->toBeTrue()
            ->and($disk->get($key))->toBe($body);

        $document = new Document([
            'storage_key'   => $key,
            'original_name' => 'integration.txt',
            'mime_type'     => 'text/plain',
        ]);

        $url = app(DocumentDownloadUrl::class)->for($document);

        expect($url)
            ->toContain('X-Amz-Algorithm=AWS4-HMAC-SHA256')
            ->toContain('X-Amz-Expires=300')
            ->toContain('integration.txt');
    } finally {
        $disk->delete($key);
    }

    expect($disk->exists($key))->toBeFalse();
});
