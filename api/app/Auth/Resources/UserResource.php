<?php

namespace App\Auth\Resources;

use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The owner as the API exposes it. The password hash is never included.
 *
 * @mixin User
 */
class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var User $user */
        $user = $this->resource;

        $emailVerifiedAt = $user->getRawOriginal('email_verified_at');

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'emailVerifiedAt' => is_string($emailVerifiedAt)
                ? Carbon::parse($emailVerifiedAt)->toIso8601String()
                : null,
        ];
    }
}
