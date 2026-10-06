<?php

namespace App\Auth\Actions;

use App\Auth\Services\AccountTokenService;
use App\Auth\Services\SessionService;
use App\Exceptions\ApiException;
use App\Models\AccountToken;
use App\Models\Session;
use Illuminate\Support\Facades\DB;

final class ResetPassword
{
    public function __construct(
        private readonly AccountTokenService $accountTokens,
        private readonly SessionService $sessions,
    ) {}

    public function handle(array $attributes): Session
    {
        return DB::transaction(function () use ($attributes): Session {
            $token = $this->accountTokens->find(
                $attributes['token'],
                AccountToken::PURPOSE_PASSWORD_RESET,
            );

            if ($token === null) {
                throw ApiException::invalidToken();
            }

            $user = $token->user;

            if ($user->password === null) {
                throw ApiException::passwordNotSupported();
            }

            if (! $this->accountTokens->claim($token)) {
                throw ApiException::invalidToken();
            }

            $user->update(['password' => $attributes['password']]);

            $session = $this->sessions->issue($user);
            $this->sessions->revokeAllExcept($user, $session);

            return $session;
        });
    }
}
