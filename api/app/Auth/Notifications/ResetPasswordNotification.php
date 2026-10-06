<?php

namespace App\Auth\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * The email that carries a single-use password reset token.
 */
class ResetPasswordNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     *
     * The raw token is passed in and never stored, so it cannot be recovered
     * from the queued job later.
     */
    public function __construct(private readonly string $token) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $url = url('/reset-password?token='.$this->token);

        return (new MailMessage)
            ->subject('Reset your password')
            ->line('Use the link below to choose a new password for your account.')
            ->action('Reset password', $url)
            ->line('The link expires in '.config('sendocs.account_token_lifetime_minutes').' minutes and can only be used once.')
            ->line('If you did not ask for this, you can ignore the email and your password stays as it is.');
    }
}
