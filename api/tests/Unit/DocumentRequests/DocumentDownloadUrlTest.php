<?php

declare(strict_types=1);

use App\DocumentRequests\Services\DocumentDownloadUrl;
use App\Models\Document;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

test('creates a five minute attachment URL with the stored MIME type', function (): void {
    Carbon::setTestNow(Carbon::create(2026, 10, 8, 22, 0, 0));

    $document = new Document([
        'storage_key' => 'requests/request/document.pdf',
        'original_name' => 'tax-2026.pdf',
        'mime_type' => 'application/pdf',
    ]);

    $disk = Mockery::mock();
    $disk->shouldReceive('temporaryUrl')
        ->once()
        ->with(
            $document->storage_key,
            Mockery::on(static fn ($expiresAt): bool =>
                $expiresAt instanceof Carbon
                && $expiresAt->equalTo(Carbon::create(2026, 10, 8, 22, 5, 0))
            ),
            [
                'ResponseContentDisposition' => 'attachment; filename="tax-2026.pdf"',
                'ResponseContentType' => 'application/pdf',
            ],
        )
        ->andReturn('https://storage.example.test/signed');

    Storage::shouldReceive('disk')
        ->once()
        ->with('s3')
        ->andReturn($disk);

    expect(app(DocumentDownloadUrl::class)->for($document))
        ->toBe('https://storage.example.test/signed');

    Carbon::setTestNow();
});
