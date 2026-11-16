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

        // Benchmark requests use a unique synthetic IP per k6 VU. Keep this
        // override and the elevated ceiling confined to the testing environment.
        $limit = static function (Request $request, int $attempts, string $period = 'minute', ?string $ownerId = null): Limit {
            $benchmark = app()->environment('testing') && $request->headers->has('X-Client-IP');
            $key       = $benchmark ? $request->ip() : ($ownerId ?? $request->ip());

            if ($benchmark) {
                $attempts = PHP_INT_MAX;
            }

            return ($period === 'hour' ? Limit::perHour($attempts) : Limit::perMinute($attempts))
                ->by($key);
        };

        RateLimiter::for('auth.register', fn (Request $request) => $limit($request, 10));

        RateLimiter::for('auth.login', fn (Request $request) => $limit($request, 10));

        // Both ends of the Google flow share one bucket per address, so a
        // callback cannot be used to buy extra authorization codes.
        RateLimiter::for('auth.oauth', fn (Request $request) => $limit($request, 10));

        // Once a caller is known the bucket is per owner, so one noisy browser
        // cannot spend another owner's allowance.
        RateLimiter::for('auth.session', fn (Request $request) => $limit($request, 120, ownerId: $request->user()?->getKey()));

        // Recovery is limited per address rather than per owner, because the
        // caller is not signed in and may not exist.
        RateLimiter::for('auth.password.forgot', fn (Request $request) => $limit($request, 5, 'hour'));

        // Redemption gets the same ceiling as the request that starts recovery,
        // in its own bucket, because the contract limits each endpoint
        // separately and neither has an owner to count against.
        RateLimiter::for('auth.password.reset', fn (Request $request) => $limit($request, 5, 'hour'));

        // The caller is signed in here, so the bucket is per owner.
        RateLimiter::for('auth.password.change', fn (Request $request) => $limit($request, 120, ownerId: $request->user()?->getKey()));

        // The link itself is the credential here, and the caller may be a
        // browser that never signed in, so redemption is limited per address.
        RateLimiter::for('auth.email.verify', fn (Request $request) => $limit($request, 5, 'hour'));

        // Asking for another link requires a session, so this one is per owner.
        RateLimiter::for('auth.email.resend', fn (Request $request) => $limit($request, 5, 'hour', $request->user()?->getKey()));

        // Deletion is irreversible, so it shares the ceiling of the other owner
        // writes rather than getting a budget of its own.
        RateLimiter::for('auth.account.destroy', fn (Request $request) => $limit($request, 120, ownerId: $request->user()?->getKey()));

        RateLimiter::for('auth.logout', fn (Request $request) => $limit($request, 120, ownerId: $request->user()?->getKey()));

        RateLimiter::for('account.update', fn (Request $request) => $limit($request, 30, ownerId: $request->user()?->getKey()));

        RateLimiter::for('portal.read', fn (Request $request) => $limit($request, 60));

        RateLimiter::for('portal.upload', fn (Request $request) => $limit($request, 30, 'hour'));

        RateLimiter::for('document-requests.read', fn (Request $request) => $limit($request, 120, ownerId: $request->user()?->getKey()));

        RateLimiter::for('document-requests.write', fn (Request $request) => $limit($request, 120, ownerId: $request->user()?->getKey()));

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
