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
     * Register any application services.
     *
     * The session service is scoped so the guard and the controller share one
     * instance, and therefore one lookup of the session cookie.
     */
    public function register(): void
    {
        $this->app->scoped(SessionService::class);
    }

    /**
     * Bootstrap any application services.
     *
     * Counters live in the cache store, which is the database, so a limit holds
     * across instances and survives a restart. Public buckets key on the client
     * IP, because an unauthenticated caller has no owner to key on.
     */
    public function boot(): void
    {
        EncryptCookies::except((string) config('session.owner_cookie.name'));

        RateLimiter::for('auth.register', fn (Request $request) => Limit::perMinute(10)
            ->by($request->ip()));

        RateLimiter::for('auth.login', fn (Request $request) => Limit::perMinute(10)
            ->by($request->ip()));

        // Both ends of the Google flow share one bucket per address, so a
        // callback cannot be used to buy extra authorization codes.
        RateLimiter::for('auth.oauth', fn (Request $request) => Limit::perMinute(10)
            ->by($request->ip()));

        // Once a caller is known the bucket is per owner, so one noisy browser
        // cannot spend another owner's allowance.
        RateLimiter::for('auth.session', fn (Request $request) => Limit::perMinute(120)
            ->by($request->user()?->getKey() ?? $request->ip()));

        // Recovery is limited per address rather than per owner, because the
        // caller is not signed in and may not exist.
        RateLimiter::for('auth.password.forgot', fn (Request $request) => Limit::perHour(5)
            ->by($request->ip()));

        // Redemption gets the same ceiling as the request that starts recovery,
        // in its own bucket, because the contract limits each endpoint
        // separately and neither has an owner to count against.
        RateLimiter::for('auth.password.reset', fn (Request $request) => Limit::perHour(5)
            ->by($request->ip()));

        // The caller is signed in here, so the bucket is per owner.
        RateLimiter::for('auth.password.change', fn (Request $request) => Limit::perMinute(120)
            ->by($request->user()?->getKey() ?? $request->ip()));

        // The link itself is the credential here, and the caller may be a
        // browser that never signed in, so redemption is limited per address.
        RateLimiter::for('auth.email.verify', fn (Request $request) => Limit::perHour(5)
            ->by($request->ip()));

        // Asking for another link requires a session, so this one is per owner.
        RateLimiter::for('auth.email.resend', fn (Request $request) => Limit::perHour(5)
            ->by($request->user()?->getKey() ?? $request->ip()));

        // Deletion is irreversible, so it shares the ceiling of the other owner
        // writes rather than getting a budget of its own.
        RateLimiter::for('auth.account.destroy', fn (Request $request) => Limit::perMinute(120)
            ->by($request->user()?->getKey() ?? $request->ip()));

        RateLimiter::for('auth.logout', fn (Request $request) => Limit::perMinute(120)
            ->by($request->user()?->getKey() ?? $request->ip()));

        // The owner guard reads the opaque cookie from the sessions table.
        Auth::viaRequest('owner', function (Request $request) {
            $session = app(SessionService::class)->resolveFromRequest($request);

            if ($session !== null) {
                $request->attributes->set('owner_session', $session);
            }

            return $session?->user;
        });
    }
}
