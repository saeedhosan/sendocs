<?php

declare(strict_types=1);

namespace App\Auth\Actions;

use App\Auth\Services\GoogleOAuthService;
use App\Auth\Services\SessionService;
use App\Models\Session;

final readonly class SignInWithGoogle
{
    public function __construct(
        private GoogleOAuthService $google,
        private SessionService $sessions,
    ) {}

    /**
     * @return array{session: Session, pictureUrl: ?string}
     */
    public function handle(string $code, string $state): array
    {
        $profile = $this->google->exchangeCode(
            $code,
            $this->google->consumeState($state),
        );

        $user = $this->google->findOrCreateUser($profile);

        return [
            'session'    => $this->sessions->issue($user),
            'pictureUrl' => $profile['pictureUrl'],
        ];
    }
}
