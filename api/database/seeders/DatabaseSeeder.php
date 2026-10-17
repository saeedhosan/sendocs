<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     *
     * The order matters: each seeder builds on the rows created above it.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            DocumentRequestSeeder::class,
            RequestItemSeeder::class,
            DocumentSeeder::class,
        ]);
    }
}
