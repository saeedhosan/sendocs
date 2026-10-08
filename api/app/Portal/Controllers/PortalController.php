<?php

declare(strict_types=1);

namespace App\Portal\Controllers;

use App\DocumentRequests\Actions\UploadDocument;
use App\Exceptions\ApiException;
use App\Models\DocumentRequest;
use App\Portal\Resources\PortalViewResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use LogicException;

final class PortalController
{
    public function show(Request $request): JsonResponse
    {
        return $this->view($request);
    }

    public function upload(
        Request $request,
        string $itemId,
        UploadDocument $uploadDocument,
    ): JsonResponse {
        $portalRequest = $this->portalRequest($request);

        $uploadDocument->handle(
            $portalRequest,
            $itemId,
            $request->file('file'),
        );

        $portalRequest->load('items.document');

        return $this->view($request);
    }

    private function view(Request $request): JsonResponse
    {
        $portalRequest = $this->portalRequest($request);
        $portalRequest->load('items.document');

        return response()->json(
            PortalViewResource::make($portalRequest)->resolve($request),
        );
    }

    private function portalRequest(Request $request): DocumentRequest
    {
        $portalRequest = $request->attributes->get('portal.request');

        if (! $portalRequest instanceof DocumentRequest) {
            throw new LogicException('Portal request was not resolved by middleware.');
        }

        return $portalRequest;
    }
}
