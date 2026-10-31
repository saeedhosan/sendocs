<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\DocumentRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<DocumentRequest>
 */
class DocumentRequestFactory extends Factory
{
    public function definition(): array
    {
        return [
            'owner_id'   => User::factory(),
            'title'      => fake()->sentence(),
            'token_hash' => Str::random(64),
            'expires_at' => now()->addDays(30),
            'revoked_at' => null,
        ];
    }

    public function revoked(): static
    {
        return $this->state(fn (array $attributes): array => [
            'revoked_at' => now(),
        ]);
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes): array => [
            'revoked_at' => null,
        ]);
    }
}
