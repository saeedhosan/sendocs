<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\AuthIdentity;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<AuthIdentity>
 */
class AuthIdentityFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id'     => User::factory(),
            'provider'    => fn (): int => array_rand(['google', 'github', 'gitlab', 'facebook']),
            'provider_id' => Str::random(32),
        ];
    }

    public function google(): static
    {
        return $this->state(fn (array $attributes): array => [
            'provider' => AuthIdentity::PROVIDER_GOOGLE,
        ]);
    }
}
