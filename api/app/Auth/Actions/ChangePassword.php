<?php

namespace App\Auth\Actions;

use App\Auth\Services\SessionService;
use App\Exceptions\ApiException;
use App\Models\Session;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

final class ChangePassword
{
    public function __construct(
        private readonly SessionService $sessions,
    ) {}

    public function handle(User $user, Session $session, array $attributes): void
    {
        if ($user->password === null) {
            throw ApiException::passwordNotSupported();
        }

        if (! Hash::check($attributes['currentPassword'], $user->password)) {
            throw ApiException::invalidCredentials();
        }

        DB::transaction(function () use ($user, $session, $attributes): void {
            $user->update(['password' => $attributes['password']]);
            $this->sessions->revokeAllExcept($user, $session);
        });
    }
}
