<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApplyBenchmarkClientIp
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (
            app()->environment('testing') &&
            $clientIp = $request->header('X-Client-IP')
        ) {
            $request->server->set('REMOTE_ADDR', $clientIp);
        }

        return $next($request);
    }
}
