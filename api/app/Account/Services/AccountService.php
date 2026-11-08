<?php

declare(strict_types=1);

namespace App\Account\Services;

use App\Account\Data\UserData;
use App\Models\User;

final class AccountService
{
    public function update(User $user, UserData $data): User
    {
        $user->forceFill(['name' => $data->name])->save();

        return $user->refresh();
    }
}
