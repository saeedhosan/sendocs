<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\DocumentRequests\Services\MagicLinkService;
use App\Models\DocumentRequest;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DocumentRequestSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Give every user a few realistic document requests and print the client
     * portal link for each one.
     */
    public function run(MagicLinkService $links): void
    {
        $titles = [
            'Visa application',
            'Apartment rental',
            'Job application',
            'University admission',
        ];

        $portalLinks = [];

        foreach (User::all() as $user) {
            foreach ($titles as $title) {
                $token = $links->generate();

                DocumentRequest::create([
                    'owner_id'   => $user->getKey(),
                    'title'      => $title,
                    'token_hash' => $links->hash($token),
                    'expires_at' => $links->expiry(),
                ]);

                $portalLinks[] = [
                    $user->email,
                    $title,
                    $links->link($token),
                ];
            }
        }

        $this->command->table(['Owner', 'Request', 'Portal link'], $portalLinks);
    }
}
