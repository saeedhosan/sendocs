<?php

declare(strict_types=1);

namespace App\Account\Controllers;

use App\Account\Data\UserData;
use App\Account\Requests\UpdateAccountRequest;
use App\Account\Services\AccountService;
use App\Auth\Resources\SessionPayloadResource;
use App\Auth\Services\CsrfTokenService;
use App\Models\Session;
use App\Models\User;
use Illuminate\Http\JsonResponse;

final class AccountController
{
    public function update(
        UpdateAccountRequest $request,
        AccountService $accounts,
        CsrfTokenService $csrf,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();
        $user = $accounts->update($user, new UserData((string) $request->validated('name')));

        /** @var Session $session */
        $session = $request->attributes->get('owner_session');
        $session->setRelation('user', $user);

        return response()->json(
            SessionPayloadResource::make([
                'session'   => $session,
                'csrfToken' => $csrf->derive($session->getKey()),
            ])->resolve($request),
        );
    }
}
