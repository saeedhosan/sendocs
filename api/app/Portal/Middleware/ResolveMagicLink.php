<?php

declare(strict_types=1);

namespace App\Portal\Middleware;

use App\Portal\Services\MagicLinkGuard;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final readonly class ResolveMagicLink
{
    public function __construct(
        private MagicLinkGuard $guard,
    ) {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $token = (string) $request->route('token');

        $request->attributes->set(
            'portal.request',
            $this->guard->resolve($token),
        );

        return $next($request);
    }
}
