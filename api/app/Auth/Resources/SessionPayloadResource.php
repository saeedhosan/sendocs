<?php

declare(strict_types=1);

namespace App\Auth\Resources;

use App\Models\AuthIdentity;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SessionPayloadResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $session    = $this['session'];
        $pictureUrl = AuthIdentity::query()
            ->where('user_id', $session->user->getKey())
            ->where('provider', AuthIdentity::PROVIDER_GOOGLE)
            ->value('picture_url');

        return [
            'user'      => new UserResource($session->user, $pictureUrl),
            'csrfToken' => $this['csrfToken'],
            'expiresAt' => $session->expires_at->toIso8601String(),
        ];
    }
}
