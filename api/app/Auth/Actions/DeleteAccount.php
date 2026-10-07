<?php

declare(strict_types=1);

namespace App\Auth\Actions;

use App\Auth\Services\SessionService;
use App\Exceptions\ApiException;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

final readonly class DeleteAccount
{
    public function __construct(
        private SessionService $sessions,
    ) {}

    public function handle(User $user, array $attributes): void
    {
        if ($user->password === null) {
            throw ApiException::passwordNotSupported();
        }

        if (! Hash::check($attributes['password'], $user->password)) {
            throw ApiException::invalidCredentials();
        }

        if (! hash_equals($user->email, $attributes['confirm'])) {
            throw ApiException::validationFailed([
                'confirm' => ['The confirmation does not match the address on file.'],
            ]);
        }

        DB::transaction(fn () => $user->delete());

        $this->sessions->forgetCookie();
    }
}
