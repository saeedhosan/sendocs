<?php

namespace App\Auth\Services;

use App\Models\Session;
use App\Models\User;
use DateTimeInterface;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Symfony\Component\HttpFoundation\Cookie as SymfonyCookie;

/**
 * Issue, resolve, and revoke the owner session cookie.
 *
 * A session is a row of its own, not a Laravel session: the cookie value is a
 * 256-bit opaque token and only its SHA-256 hash is stored, so a database
 * leak yields nothing replayable.
 */
final class SessionService
{
    /**
     * The request the current session was resolved for, if any.
     */
    private ?Request $resolvedFor = null;

    /**
     * The session the cookie resolved to, or null when signed out.
     */
    private ?Session $current = null;

    /**
     * Create a session for the owner and queue its cookie on the response.
     *
     * The raw token never leaves this method, because only its hash is stored.
     */
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

    /**
     * Resolve the request's cookie to its session, or null when signed out.
     *
     * The guard may be resolved more than once during a request, so the answer is
     * remembered for the request it came from: one indexed read per request.
     */
    public function resolveFromRequest(Request $request): ?Session
    {
        if ($this->resolvedFor !== $request) {
            $this->current = $this->lookup($request->cookie($this->cookieName()));
            $this->resolvedFor = $request;
        }

        return $this->current;
    }

    /**
     * Look up one cookie value, treating anything unusable as signed out.
     */
    private function lookup(mixed $token): ?Session
    {
        // A value that cannot be a token is refused before it reaches the
        // database, so a mangled cookie costs nothing.
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

    /**
     * Drop an expired session, without letting cleanup fail the request.
     *
     * The caller is signed out either way, so a database problem here must
     * not turn a clean 401 into a 500.
     */
    private function deleteQuietly(Session $session): void
    {
        try {
            $session->delete();
        } catch (QueryException $exception) {
            report($exception);
        }
    }

    /**
     * The name of the session cookie.
     */
    private function cookieName(): string
    {
        return (string) config('session.owner_cookie.name');
    }

    /**
     * Resolve a cookie value to its session, or null when it is unknown.
     *
     * The owner comes with it, so identifying the caller costs no further read.
     */
    public function resolve(string $token): ?Session
    {
        return Session::query()
            ->with('user')
            ->where('token_hash', SecureToken::hash($token))
            ->first();
    }

    /**
     * Delete one session, so its cookie is inert.
     *
     * The resolved session is passed in rather than the cookie value: the raw
     * token is gone by design, and the row id is what identifies it.
     */
    public function revoke(Session $session): void
    {
        $session->delete();

        $this->forgetCookie();
    }

    /**
     * Expire the session cookie in the browser.
     *
     * Callers that have already removed the row queue this for tidiness rather
     * than security: it stops a dead cookie being sent on every later request.
     * The path has to match the one it was issued with or the browser keeps it.
     */
    public function forgetCookie(): void
    {
        Cookie::queue(Cookie::forget($this->cookieName(), '/'));
    }

    /**
     * Delete every session of the owner except the current one.
     */
    public function revokeAllExcept(User $user, Session $session): void
    {
        Session::query()
            ->where('user_id', $user->getKey())
            ->whereKeyNot($session->getKey())
            ->delete();
    }

    /**
     * Build the opaque session cookie: HttpOnly, Secure in production, and
     * SameSite=Lax, which blocks the cross-site POST that CSRF exists to stop
     * while still allowing a deep link from an email client.
     */
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
