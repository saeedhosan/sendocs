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
            ->toStartWith(rtrim((string) config('filesystems.disks.s3-browser.endpoint'), '/').'/')
            ->toContain('X-Amz-Algorithm=AWS4-HMAC-SHA256')
            ->toContain('X-Amz-Expires=300')
            ->toContain('integration.txt');
    } finally {
        $disk->delete($key);
    }

    expect($disk->exists($key))->toBeFalse();
});

test('signs download URLs with the browser-facing endpoint', function (): void {
    config([
        'filesystems.disks.s3-browser.key'                     => 'test-access-key',
        'filesystems.disks.s3-browser.secret'                  => 'test-secret-key',
        'filesystems.disks.s3-browser.region'                  => 'us-east-1',
        'filesystems.disks.s3-browser.bucket'                  => 'sendocs-private',
        'filesystems.disks.s3-browser.endpoint'                => 'https://storage.example.test',
        'filesystems.disks.s3-browser.use_path_style_endpoint' => true,
    ]);

    Storage::forgetDisk('s3-browser');

    $document = new Document([
        'storage_key'   => 'requests/request/document.pdf',
        'original_name' => 'tax-2026.pdf',
        'mime_type'     => 'application/pdf',
    ]);

    $url = app(DocumentDownloadUrl::class)->for($document);

    $query = [];
    parse_str((string) parse_url($url, PHP_URL_QUERY), $query);

    expect(parse_url($url, PHP_URL_SCHEME))
        ->toBe('https')
        ->and(parse_url($url, PHP_URL_HOST))
        ->toBe('storage.example.test')
        ->and(parse_url($url, PHP_URL_PATH))
        ->toBe('/sendocs-private/requests/request/document.pdf')
        ->and($query['X-Amz-Algorithm'] ?? null)
        ->toBe('AWS4-HMAC-SHA256')
        ->and($query['X-Amz-Expires'] ?? null)
        ->toBe('300');
});
