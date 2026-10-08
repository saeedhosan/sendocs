<?php

declare(strict_types=1);

namespace App\DocumentRequests\Controllers;

use App\DocumentRequests\Actions\CreateRequest;
use App\DocumentRequests\Requests\CreateRequest as CreateRequestInput;
use App\DocumentRequests\Resources\CreatedRequestResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DocumentRequestController
{
    public function store(CreateRequestInput $request, CreateRequest $create): JsonResponse
    {
        $result = $create->handle($request->user(), $request->validated());

        return response()->json(
            CreatedRequestResource::make([
                'request' => $result['request'],
                'url' => app(\App\DocumentRequests\Services\MagicLinkService::class)->link($result['token']),
            ])->resolve($request),
            201,
        );
    }
}