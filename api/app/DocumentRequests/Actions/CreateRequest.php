<?php

declare(strict_types=1);

namespace App\DocumentRequests\Actions;

use App\DocumentRequests\Services\MagicLinkService;
use App\Models\DocumentRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class CreateRequest
{
    public function __construct(
        private MagicLinkService $links,
    ) {}

    /** @return array{request: DocumentRequest, token: string} */
    public function handle(User $owner, array $attributes): array
    {
        $token = $this->links->generate();

        $request = DB::transaction(function () use ($owner, $attributes, $token): DocumentRequest {
            $request = new DocumentRequest([
                'owner_id'   => $owner->getKey(),
                'title'      => $attributes['title'],
                'token_hash' => $this->links->hash($token),
                'expires_at' => $this->links->expiry(),
            ]);
            $request->save();

            foreach (array_values($attributes['items']) as $position => $item) {
                $request->items()->create([
                    'label'    => $item['label'],
                    'position' => $position + 1,
                ]);
            }

            return $request->load('items');
        });

        return ['request' => $request, 'token' => $token];
    }
}
