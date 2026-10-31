<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Document;
use App\Models\RequestItem;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Document>
 */
class DocumentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'request_item_id' => RequestItem::factory(),
            'storage_key'     => Str::random(40),
            'original_name'   => fake()->word().'.'.Str::random(3),
            'mime_type'       => fake()->mimeType(),
            'size_bytes'      => fake()->numberBetween(100, 10000000),
            'sha256'          => Str::random(64),
        ];
    }
}
