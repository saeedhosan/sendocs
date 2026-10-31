<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\DocumentRequest;
use App\Models\RequestItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RequestItem>
 */
class RequestItemFactory extends Factory
{
    public function definition(): array
    {
        return [
            'request_id' => DocumentRequest::factory(),
            'label'      => fake()->word(),
            'position'   => fake()->numberBetween(1, 10),
        ];
    }

    public function withDocument(): static
    {
        return $this->state(fn (array $attributes): array => [
            'position' => 1,
        ]);
    }
}
