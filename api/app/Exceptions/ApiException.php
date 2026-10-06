<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;
use Throwable;

/**
 * An error the API states on purpose, in the one published envelope.
 *
 * Codes are stable and machine-readable, messages are human-readable, and
 * `details` is present only on validation failures.
 */
class ApiException extends RuntimeException
{
    /**
     * @param  array<string, mixed>  $details
     * @param  array<string, string>  $headers
     */
    public function __construct(
        public readonly string $errorCode,
        string $message,
        public readonly int $status,
        public readonly array $details = [],
        public readonly array $headers = [],
        ?Throwable $previous = null,
    ) {
        parent::__construct($message, 0, $previous);
    }

    /**
     * No usable session on the request.
     */
    public static function unauthenticated(): self
    {
        return new self('unauthenticated', 'Sign in to continue.', 401);
    }

    /**
     * The CSRF token is missing or belongs to another session.
     */
    public static function csrfFailed(): self
    {
        return new self('csrf_failed', 'The request could not be verified. Reload the page and try again.', 403);
    }

    /**
     * Wrong password, or an address that is not registered.
     */
    public static function invalidCredentials(): self
    {
        return new self('invalid_credentials', 'Email or password is incorrect.', 401);
    }

    /**
     * The address is already registered.
     */
    public static function emailTaken(): self
    {
        return new self('email_taken', 'That email address is already registered.', 409);
    }

    /**
     * The Google flow could not be completed.
     */
    public static function oauthFailed(string $message = 'Google sign-in failed. Try again.'): self
    {
        return new self('oauth_failed', $message, 400);
    }

    /**
     * The address belongs to an owner who signs in with a password.
     */
    public static function oauthProviderConflict(): self
    {
        return new self(
            'oauth_provider_conflict',
            'That email is already registered with a different sign-in method.',
            409,
        );
    }

    /**
     * A reset or verification token that is unknown, expired, or already used.
     *
     * One code covers all three, so a caller cannot tell a wrong token from a
     * spent one.
     */
    public static function invalidToken(): self
    {
        return new self('invalid_token', 'This link has expired or has already been used.', 410);
    }

    /**
     * The account has no password to operate on, because it only ever signed in
     * through an identity provider.
     */
    public static function passwordNotSupported(): self
    {
        return new self('password_not_supported', 'Password operations are not available for this account.', 400);
    }

    /**
     * A field-level failure, reported once per field.
     *
     * @param  array<string, list<string>>  $errors
     */
    public static function validationFailed(array $errors): self
    {
        $details = array_map(
            fn (array $messages): string => (string) reset($messages),
            $errors,
        );

        return new self('validation_failed', 'Check the highlighted fields.', 422, $details);
    }

    /**
     * Render the exception as the published error envelope.
     */
    public function render(Request $request): JsonResponse
    {
        $error = [
            'code' => $this->errorCode,
            'message' => $this->getMessage(),
        ];

        if ($this->details !== []) {
            $error['details'] = $this->details;
        }

        return response()->json(['error' => $error], $this->status, $this->headers);
    }
}
