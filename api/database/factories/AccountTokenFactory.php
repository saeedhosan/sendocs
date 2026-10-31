<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\AccountToken;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<AccountToken>
 */
class AccountTokenFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'purpose' => fn () => Str::random(10) === 'password' ? 'password_reset' : 'email_verification',
            'token_hash' => Str::random(64),
            'expires_at' => now()->addDays(21),
            'used_at' => null,
        ];
    }

    public function passwordReset(): static
    {
        return $this->state(fn (array $attributes): array => [
            'purpose' => AccountToken::PURPOSE_PASSWORD_RESET,
            'token_hash' => Str::random(64),
        ]);
    }

    public function emailVerification(): static
    {
        return $this->state(fn (array $attributes): array => [
            'purpose' => AccountToken::PURPOSE_EMAIL_VERIFICATION,
        ]);
    }
}