<?php

declare(strict_types=1);

namespace App\DocumentRequests\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CreatedRequestResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $value = $this->resource;

        return [
            'request' => RequestDetailResource::make($value['request'])->resolve($request),
            'link'    => [
                'url'       => $value['url'],
                'expiresAt' => $value['request']->expires_at->toIso8601String(),
            ],
        ];
    }
}
