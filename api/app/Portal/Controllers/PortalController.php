<?php

declare(strict_types=1);

namespace App\Portal\Controllers;

use App\Portal\Resources\PortalViewResource;
use App\Portal\Services\MagicLinkGuard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class PortalController
{
    public function show(
        string $token,
        MagicLinkGuard $guard,
        Request $request,
    ): JsonResponse {
        $portalRequest = $guard->resolve($token)->load('items');

        return response()->json(
            PortalViewResource::make($portalRequest)->resolve($request),
        );
    }
}
