<?php

namespace App\Auth\Services;

use App\Auth\Notifications\ResetPasswordNotification;
use App\Auth\Notifications\VerifyEmailNotification;
use App\Models\User;
use Illuminate\Support\Facades\Notification;

/**
 * Queue the owner account emails.
 *
 * Every send is queued, so a provider outage never fails or delays the request
 * that triggered it, and the token is always stored before dispatch, so a lost
 * job is recoverable by asking for another link.
 */
final class AuthMailer
{
    /**
     * Send the verification link for a registration.
     *
     * The raw token comes from the caller because only its hash is stored, so
     * this is the one chance to put it in an email.
     */
    public function sendVerification(User $user, string $token): void
    {
        Notification::route('mail', $user->email)
            ->notify(new VerifyEmailNotification($token));
    }

    /**
     * Send the reset link for a forgotten password.
     *
     * The raw token comes from the caller for the same reason as the
     * verification link: only its hash is stored.
     */
    public function sendPasswordReset(User $user, string $token): void
    {
        Notification::route('mail', $user->email)
            ->notify(new ResetPasswordNotification($token));
    }
}
