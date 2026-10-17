<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\DocumentRequest;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DocumentRequestSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Give every user a few realistic document requests.
     */
    public function run(): void
    {
        $titles = [
            'Visa application',
            'Apartment rental',
            'Job application',
            'University admission',
        ];

        foreach (User::all() as $user) {
            foreach ($titles as $title) {
                DocumentRequest::create([
                    'owner_id'   => $user->getKey(),
                    'title'      => $title,
                    'token_hash' => hash('sha256', Str::random(40)),
                    'expires_at' => now()->addDays(14),
                ]);
            }
        }
    }
}
