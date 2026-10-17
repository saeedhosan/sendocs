<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed a couple of demo users.
     */
    public function run(): void
    {
        User::factory()->create([
            'name'     => 'Alex Nouri',
            'email'    => 'alex@example.com',
            'password' => 'alex@example.com',
        ]);
    }
}
