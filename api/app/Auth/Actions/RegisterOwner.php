<?php

declare(strict_types=1);

namespace App\Auth\Actions;

use App\Auth\Services\AccountTokenService;
use App\Auth\Services\AuthMailer;
use App\Auth\Services\SessionService;
use App\Exceptions\ApiException;
use App\Models\AccountToken;
use App\Models\Session;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

final readonly class RegisterOwner
{
    public function __construct(
        private SessionService $sessions,
        private AccountTokenService $accountTokens,
        private AuthMailer $mailer,
    ) {}

    /** @return array{user: User, session: Session} */
    public function handle(array $attributes): array
    {
        if (User::query()->where('email', $attributes['email'])->exists()) {
            throw ApiException::emailTaken();
        }

        try {
            [$user, $session] = DB::transaction(function () use ($attributes): array {
                $user = User::query()->create([
                    'name'     => $attributes['name'],
                    'email'    => $attributes['email'],
                    'password' => $attributes['password'],
                ]);

                $session = $this->sessions->issue($user);
                $token   = $this->accountTokens->issue($user, AccountToken::PURPOSE_EMAIL_VERIFICATION);

                DB::afterCommit(fn () => $this->mailer->sendVerification($user, $token));

                return [$user, $session];
            });
        } catch (QueryException $queryException) {
            if ($queryException->getCode() === '23505') {
                throw ApiException::emailTaken();
            }

            throw $queryException;
        }

        return ['user' => $user, 'session' => $session];
    }
}
