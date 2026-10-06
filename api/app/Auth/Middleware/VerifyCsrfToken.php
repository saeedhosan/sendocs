<?php

namespace App\Auth\Middleware;

use App\Auth\Services\CsrfTokenService;
use App\Auth\Services\SessionService;
use App\Exceptions\ApiException;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Require the session's CSRF token on every state-changing owner request.
 *
 * The framework's own middleware compares Laravel's session token, which this
 * application does not use: the token here is an HMAC of the session id, read
 * only from the header and never from a cookie, so a cross-origin caller can
 * neither read nor forge it. A missing or mismatched token is a 403.
 */
final class VerifyCsrfToken
{
    /**
     * Create a new class instance.
     */
    public function __construct(
        private readonly SessionService $sessions,
        private readonly CsrfTokenService $csrf,
    ) {}

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $session = $this->sessions->resolveFromRequest($request);

        if ($session === null) {
            throw ApiException::unauthenticated();
        }

        if (! $request->isMethodSafe() && ! $this->csrf->verify($session->getKey(), $request->header('X-CSRF-Token'))) {
            throw ApiException::csrfFailed();
        }

        return $next($request);
    }
}
