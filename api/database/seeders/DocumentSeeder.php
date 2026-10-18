<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\DocumentRequest;
use App\Models\RequestItem;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Upload a document for every item of the first request, so it shows up
     * as "complete" instead of "waiting".
     */
    public function run(): void
    {
        $request = DocumentRequest::query()->with('items')->first();

        if ($request === null) {
            return;
        }

        foreach ($request->items as $item) {
            $this->upload($request, $item);
        }
    }

    private function upload(DocumentRequest $request, RequestItem $item): void
    {
        $extension = str_contains($item->label, 'photo') ? 'jpg' : 'pdf';
        $content   = sprintf('Demo document for "%s".', $item->label);

        $storageKey = $request->getKey().'/'.Str::random(64);
        Storage::put($storageKey, $content);

        $item->document()->create([
            'storage_key'   => $storageKey,
            'original_name' => Str::slug($item->label).'.'.$extension,
            'mime_type'     => $extension === 'jpg' ? 'image/jpeg' : 'application/pdf',
            'size_bytes'    => strlen($content),
            'sha256'        => hash('sha256', $content),
            'uploaded_at'   => now(),
        ]);
    }
}
