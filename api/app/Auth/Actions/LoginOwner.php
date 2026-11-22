<?php

declare(strict_types=1);

namespace App\Auth\Actions;

use App\Auth\Services\SessionService;
use App\Exceptions\ApiException;
use App\Models\Session;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

final readonly class LoginOwner
{
    /**
     * Precomputed Argon2id hash of 'dummy-password'. Regenerate with Hash::make()
     * whenever the configured hashing driver or its work factors change.
     */
    private const string DUMMY_PASSWORD_HASH = '$argon2id$v=19$m=65536,t=4,p=1$cmIvWEIxbDFKbDRSNU9TTQ$tKKCesLpm41pGzfhv/dXONTiZXYDL+JzSKwHs15i1Ys';

    public function __construct(
        private SessionService $sessions,
    ) {}

    public function handle(array $attributes): Session
    {
        $user = User::query()->where('email', $attributes['email'])->first();

        if ($user === null || $user->password === null || ! Hash::check($attributes['password'], $user->password)) {
            Hash::check('dummy-password', self::DUMMY_PASSWORD_HASH);

            throw ApiException::invalidCredentials();
        }

        return $this->sessions->issue($user);
    }
}
