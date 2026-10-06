<?php

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
            'user' => UserResource::make($session->user),
            'csrfToken' => $this['csrfToken'],
            'expiresAt' => $session->expires_at->toIso8601String(),
        ];
    }
}
