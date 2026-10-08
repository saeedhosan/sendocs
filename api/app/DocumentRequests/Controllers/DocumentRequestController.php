<?php

declare(strict_types=1);

namespace App\DocumentRequests\Controllers;

use App\DocumentRequests\Actions\CreateRequest;
use App\DocumentRequests\Actions\DeleteDocument;
use App\DocumentRequests\Actions\DeleteRequest;
use App\DocumentRequests\Actions\ListRequests;
use App\DocumentRequests\Actions\RevokeRequest;
use App\DocumentRequests\Actions\ShowRequest;
use App\DocumentRequests\Requests\CreateRequest as CreateRequestInput;
use App\DocumentRequests\Requests\ListRequests as ListRequestsInput;
use App\DocumentRequests\Resources\CreatedRequestResource;
use App\DocumentRequests\Resources\RequestDetailResource;
use App\DocumentRequests\Resources\RequestSummaryResource;
use App\DocumentRequests\Services\MagicLinkService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DocumentRequestController
{
    public function index(ListRequestsInput $request, ListRequests $list): JsonResponse
    {
        $paginator = $list->handle($request->user(), $request->limit(), $request->cursor());

        return response()->json([
            'data' => RequestSummaryResource::collection($paginator->items())->resolve($request),
            'nextCursor' => $paginator->nextCursor()?->encode(),
        ]);
    }

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

    public function revoke(
        string $requestId,
        RevokeRequest $revoke,
        Request $request,
    ): JsonResponse {
        return response()->json(
            RequestDetailResource::make($revoke->handle($request->user(), $requestId))->resolve($request),
        );
    }

    public function destroy(
        string $requestId,
        DeleteRequest $delete,
        ShowRequest $show,
        Request $request,
    ): \Illuminate\Http\Response {
        $documentRequest = $show->handle($request->user(), $requestId);
        $delete->execute($documentRequest);

        return response()->noContent();
    }

    public function destroyDocument(
        string $requestId,
        string $itemId,
        DeleteDocument $delete,
        Request $request,
    ): \Illuminate\Http\Response {
        $documentRequest = $show->handle($request->user(), $requestId);
        $delete->execute($documentRequest, $itemId);

        return response()->noContent();
    }

    public function show(
        string $requestId,
        ShowRequest $show,
        \Illuminate\Http\Request $request,
    ): JsonResponse {
        return response()->json(
            RequestDetailResource::make($show->handle($request->user(), $requestId))->resolve($request),
        );
    }
}
