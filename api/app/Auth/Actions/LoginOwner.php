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
    public function __construct(
        private SessionService $sessions,
    ) {}

    public function handle(array $attributes): Session
    {
        $user = User::query()->where('email', $attributes['email'])->first();

        if ($user === null || $user->password === null || ! Hash::check($attributes['password'], $user->password)) {
            Hash::check('dummy-password', '$2y$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW');

            throw ApiException::invalidCredentials();
        }

        return $this->sessions->issue($user);
    }
}
