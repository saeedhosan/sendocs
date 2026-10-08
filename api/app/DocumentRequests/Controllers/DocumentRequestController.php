<?php

declare(strict_types=1);

namespace App\DocumentRequests\Controllers;

use App\DocumentRequests\Actions\CreateRequest;
use App\DocumentRequests\Requests\CreateRequest as CreateRequestInput;
use App\DocumentRequests\Resources\CreatedRequestResource;
use App\DocumentRequests\Services\MagicLinkService;
use Illuminate\Http\JsonResponse;

class DocumentRequestController
{
    public function store(
        CreateRequestInput $request,
        CreateRequest $create,
        MagicLinkService $links,
    ): JsonResponse {
        $result = $create->handle($request->user(), $request->validated());

        return response()->json(
            CreatedRequestResource::make([
                'request' => $result['request'],
                'url' => $links->link($result['token']),
            ])->resolve($request),
            201,
        );
    }
}
