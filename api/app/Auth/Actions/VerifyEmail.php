<?php

declare(strict_types=1);

namespace App\Auth\Actions;

use App\Auth\Services\AccountTokenService;
use App\Exceptions\ApiException;
use App\Models\AccountToken;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

final readonly class VerifyEmail
{
    public function __construct(
        private AccountTokenService $accountTokens,
    ) {}

    public function handle(string $token): Carbon
    {
        return DB::transaction(function () use ($token) {
            $accountToken = $this->accountTokens->find(
                $token,
                AccountToken::PURPOSE_EMAIL_VERIFICATION,
            );

            if (! $accountToken instanceof AccountToken || ! $this->accountTokens->claim($accountToken)) {
                throw ApiException::invalidToken();
            }

            $user       = $accountToken->user;
            $verifiedAt = $user->email_verified_at ?? now();

            $user->forceFill(['email_verified_at' => $verifiedAt])->save();

            return $verifiedAt;
        });
    }
}
