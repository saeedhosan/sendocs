<?php

declare(strict_types=1);

namespace App\Auth\Services;

use App\Models\AccountToken;
use App\Models\User;

/**
 * Issue single-use reset and verification tokens.
 */
final class AccountTokenService
{
    /**
     * Issue a token for one purpose and return the raw value, which is
     * available once and never stored.
     *
     * Any earlier token for the same purpose is removed, so an owner holds at
     * most one live token per purpose.
     */
    public function issue(User $user, string $purpose): string
    {
        $this->revokeAll($user, $purpose);

        $token = SecureToken::generate();

        AccountToken::query()->create([
            'user_id'    => $user->getKey(),
            'purpose'    => $purpose,
            'token_hash' => SecureToken::hash($token),
            'expires_at' => now()->addMinutes((int) config('auth.account_token_lifetime_minutes')),
        ]);

        return $token;
    }

    /**
     * Find a live token of one purpose, or null when there is none.
     *
     * Expired and already-used rows are reported as missing, so every way of
     * failing looks the same to the caller.
     */
    public function find(string $token, string $purpose): ?AccountToken
    {
        return AccountToken::query()
            ->where('token_hash', SecureToken::hash($token))
            ->where('purpose', $purpose)
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->first();
    }

    /**
     * Spend a token, and report whether this caller was the one that spent it.
     *
     * The condition is in the UPDATE rather than the read that found the row, so
     * two requests holding the same token cannot both succeed: the second one
     * updates nothing.
     */
    public function claim(AccountToken $token): bool
    {
        return AccountToken::query()
            ->whereKey($token->getKey())
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->update(['used_at' => now()]) === 1;
    }

    /**
     * Remove every token of one purpose for an owner.
     */
    public function revokeAll(User $user, string $purpose): void
    {
        AccountToken::query()
            ->where('user_id', $user->getKey())
            ->where('purpose', $purpose)
            ->delete();
    }
}
