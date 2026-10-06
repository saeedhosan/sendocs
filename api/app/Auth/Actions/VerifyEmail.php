<?php

namespace App\Auth\Actions;

use App\Auth\Services\AccountTokenService;
use App\Exceptions\ApiException;
use App\Models\AccountToken;
use Illuminate\Support\Facades\DB;

final class VerifyEmail
{
    public function __construct(
        private readonly AccountTokenService $accountTokens,
    ) {}

    public function handle(string $token)
    {
        return DB::transaction(function () use ($token) {
            $accountToken = $this->accountTokens->find(
                $token,
                AccountToken::PURPOSE_EMAIL_VERIFICATION,
            );

            if ($accountToken === null || ! $this->accountTokens->claim($accountToken)) {
                throw ApiException::invalidToken();
            }

            $user = $accountToken->user;
            $verifiedAt = $user->email_verified_at ?? now();

            $user->forceFill(['email_verified_at' => $verifiedAt])->save();

            return $verifiedAt;
        });
    }
}
