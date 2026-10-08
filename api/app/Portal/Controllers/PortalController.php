<?php

declare(strict_types=1);

namespace App\Portal\Controllers;

use App\Models\DocumentRequest;
use App\Portal\Resources\PortalViewResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use LogicException;

final class PortalController
{
    public function show(Request $request): JsonResponse
    {
        $portalRequest = $request->attributes->get('portal.request');

        if (! $portalRequest instanceof DocumentRequest) {
            throw new LogicException('Portal request was not resolved by middleware.');
        }

        $portalRequest->load('items');

        return response()->json(
            PortalViewResource::make($portalRequest)->resolve($request),
        );
    }
}
