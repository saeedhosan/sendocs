<?php

namespace App\Auth\Actions;

use App\Auth\Services\GoogleOAuthService;
use App\Auth\Services\SessionService;
use App\Models\Session;

final class SignInWithGoogle
{
    public function __construct(
        private readonly GoogleOAuthService $google,
        private readonly SessionService $sessions,
    ) {}

    public function handle(string $code, string $state): Session
    {
        $profile = $this->google->exchangeCode(
            $code,
            $this->google->consumeState($state),
        );

        $user = $this->google->findOrCreateUser($profile);

        return $this->sessions->issue($user);
    }
}
