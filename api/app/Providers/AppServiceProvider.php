<?php

declare(strict_types=1);

namespace App\Providers;

use App\Auth\Services\SessionService;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register application services.
     *
     * The session service is scoped so the guard and the controller share one
     * instance, and therefore one lookup of the session cookie.
     */
    public function register(): void
    {
        $this->app->scoped(SessionService::class);
    }

    /**
     * Bootstrap application services.
     *
     * Counters live in the cache store, so limits hold across instances and
     * survive a restart. Public buckets key on the client IP.
     */
    public function boot(): void
    {
        EncryptCookies::except((string) config('session.owner_cookie.name'));

        RateLimiter::for('auth.register', fn (Request $request) => Limit::perMinute(10)
            ->by($request->ip()));

        RateLimiter::for('auth.login', fn (Request $request) => Limit::perMinute(10)
            ->by($request->ip()));

        RateLimiter::for('auth.oauth', fn (Request $request) => Limit::perMinute(10)
            ->by($request->ip()));

        RateLimiter::for('auth.session', fn (Request $request) => Limit::perMinute(120)
            ->by($request->user()?->getKey() ?? $request->ip()));

        RateLimiter::for('auth.password.forgot', fn (Request $request) => Limit::perHour(5)
            ->by($request->ip()));

        RateLimiter::for('auth.password.reset', fn (Request $request) => Limit::perHour(5)
            ->by($request->ip()));

        RateLimiter::for('auth.password.change', fn (Request $request) => Limit::perMinute(120)
            ->by($request->user()?->getKey() ?? $request->ip()));

        RateLimiter::for('auth.email.verify', fn (Request $request) => Limit::perHour(5)
            ->by($request->ip()));

        RateLimiter::for('auth.email.resend', fn (Request $request) => Limit::perHour(5)
            ->by($request->user()?->getKey() ?? $request->ip()));

        RateLimiter::for('auth.account.destroy', fn (Request $request) => Limit::perMinute(120)
            ->by($request->user()?->getKey() ?? $request->ip()));

        RateLimiter::for('auth.logout', fn (Request $request) => Limit::perMinute(120)
            ->by($request->user()?->getKey() ?? $request->ip()));

        RateLimiter::for('portal.read', fn (Request $request) => Limit::perMinute(60)
            ->by($request->ip()));

        RateLimiter::for('portal.upload', fn (Request $request) => Limit::perHour(30)
            ->by($request->ip()));

        RateLimiter::for('document-requests.read', fn (Request $request) => Limit::perMinute(120)
            ->by($request->user()?->getKey() ?? $request->ip()));

        RateLimiter::for('document-requests.write', fn (Request $request) => Limit::perMinute(120)
            ->by($request->user()?->getKey() ?? $request->ip()));

        Auth::viaRequest('owner', function (Request $request) {
            $session = app(SessionService::class)->resolveFromRequest($request);

            if ($session !== null) {
                $request->attributes->set('owner_session', $session);
            }

            return $session?->user;
        });
    }
}
