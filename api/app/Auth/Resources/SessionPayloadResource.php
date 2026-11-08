<?php

declare(strict_types=1);

namespace App\Auth\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SessionPayloadResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $session = $this['session'];

        return [
            'user'      => new UserResource($session->user, $this['pictureUrl'] ?? null),
            'csrfToken' => $this['csrfToken'],
            'expiresAt' => $session->expires_at->toIso8601String(),
        ];
    }
}
