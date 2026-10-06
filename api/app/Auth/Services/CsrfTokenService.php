<?php

namespace App\Auth\Services;

/**
 * Derive and verify the session-bound CSRF token.
 *
 * The value is an HMAC of the session id under CSRF_SECRET, so it needs no
 * token table and no per-request read, and it cannot be replayed on another
 * session. It is never read from a cookie, so there is nothing to inject.
 */
final class CsrfTokenService
{
    /**
     * Derive the token for one session.
     */
    public function derive(string $sessionId): string
    {
        return hash_hmac('sha256', $sessionId, (string) config('auth.csrf_secret'));
    }

    /**
     * Check a submitted token against the session it must belong to.
     */
    public function verify(string $sessionId, ?string $token): bool
    {
        return $token !== null && hash_equals($this->derive($sessionId), $token);
    }
}
