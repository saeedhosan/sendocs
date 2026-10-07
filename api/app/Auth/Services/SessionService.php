<?php

namespace App\Auth\Services;

use App\Models\Session;
use App\Models\User;
use DateTimeInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Symfony\Component\HttpFoundation\Cookie as SymfonyCookie;
use Throwable;

/**
 * Issue, resolve, and revoke the owner session cookie.
 *
 * A session is a row of its own, not a Laravel session: the cookie value is a
 * 256-bit opaque token and only its SHA-256 hash is stored, so a database
 * leak yields nothing replayable.
 */
final class SessionService
{
    private ?Request $resolvedFor = null;

    private ?Session $current = null;

    public function issue(User $user): Session
    {
        $token = SecureToken::generate();

        $session = new Session([
            'user_id' => $user->getKey(),
            'token_hash' => SecureToken::hash($token),
            'expires_at' => now()->addDays((int) config('session.owner_cookie.lifetime_days')),
        ]);
        $session->save();

        Cookie::queue($this->makeCookie($token, $session->expires_at));

        return $session;
    }

    public function resolveFromRequest(Request $request): ?Session
    {
        if ($this->resolvedFor !== $request) {
            $this->current = $this->lookup($request->cookie($this->cookieName()));
            $this->resolvedFor = $request;
        }

        return $this->current;
    }

    private function lookup(mixed $token): ?Session
    {
        if (! is_string($token) || preg_match('/^[A-Za-z0-9_-]{43}$/', $token) !== 1) {
            return null;
        }

        $session = $this->resolve($token);

        if ($session === null) {
            return null;
        }

        if ($session->expires_at->isPast()) {
            $this->deleteQuietly($session);

            return null;
        }

        return $session;
    }

    private function deleteQuietly(Session $session): void
    {
        try {
            $session->delete();
        } catch (Throwable $exception) {
            report($exception);
        }
    }

    private function cookieName(): string
    {
        return (string) config('session.owner_cookie.name');
    }

    public function resolve(string $token): ?Session
    {
        return Session::query()
            ->with('user')
            ->where('token_hash', SecureToken::hash($token))
            ->first();
    }

    public function revoke(Session $session): void
    {
        $session->delete();

        $this->forgetCookie();
    }

    public function forgetCookie(): void
    {
        Cookie::queue(Cookie::forget($this->cookieName(), '/'));
    }

    public function revokeAllExcept(User $user, Session $session): void
    {
        Session::query()
            ->where('user_id', $user->getKey())
            ->whereKeyNot($session->getKey())
            ->delete();
    }

    private function makeCookie(string $token, DateTimeInterface $expiresAt): SymfonyCookie
    {
        return Cookie::make(
            (string) config('session.owner_cookie.name'),
            $token,
            (int) now()->diffInMinutes($expiresAt),
            '/',
            null,
            (bool) config('session.owner_cookie.secure'),
            true,
            true,
            'Lax',
        );
    }
}
