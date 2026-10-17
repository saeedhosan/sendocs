<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\DocumentRequest;
use App\Models\RequestItem;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RequestItemSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Attach a few requested documents to every document request.
     */
    public function run(): void
    {
        $labels = [
            'Proof of identity',
            'Proof of address',
            'Recent bank statement',
            'Signed agreement',
            'Supporting photo',
            'Reference letter',
        ];

        foreach (DocumentRequest::all() as $index => $request) {
            $items = array_slice($labels, $index % 4, 3);

            foreach ($items as $position => $label) {
                RequestItem::create([
                    'request_id' => $request->getKey(),
                    'label'      => $label,
                    'position'   => $position + 1,
                ]);
            }
        }
    }
}
