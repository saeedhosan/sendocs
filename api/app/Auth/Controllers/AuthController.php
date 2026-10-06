<?php

namespace App\Auth\Controllers;

use App\Auth\Actions\ChangePassword;
use App\Auth\Actions\DeleteAccount;
use App\Auth\Actions\LoginOwner;
use App\Auth\Actions\RegisterOwner;
use App\Auth\Actions\ResetPassword;
use App\Auth\Actions\SignInWithGoogle;
use App\Auth\Actions\VerifyEmail;
use App\Auth\Requests\ChangePasswordRequest;
use App\Auth\Requests\DeleteAccountRequest;
use App\Auth\Requests\ForgotPasswordRequest;
use App\Auth\Requests\GoogleOAuthCallbackRequest;
use App\Auth\Requests\LoginRequest;
use App\Auth\Requests\RegisterRequest;
use App\Auth\Requests\ResetPasswordRequest;
use App\Auth\Requests\VerifyEmailRequest;
use App\Auth\Resources\SessionPayloadResource;
use App\Auth\Services\AccountTokenService;
use App\Auth\Services\AuthMailer;
use App\Auth\Services\CsrfTokenService;
use App\Auth\Services\GoogleOAuthService;
use App\Auth\Services\SessionService;
use App\Http\Controllers\Controller;
use App\Models\AccountToken;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    public function register(
        RegisterRequest $request,
        RegisterOwner $register,
        CsrfTokenService $csrf,
    ): JsonResponse {
        $result = $register->handle($request->validated());

        return response()->json(
            SessionPayloadResource::make(['session' => $result['session'], 'csrfToken' => $csrf->derive($result['session']->id)])
                ->resolve($request),
            201,
        );
    }

    public function login(
        LoginRequest $request,
        LoginOwner $login,
        CsrfTokenService $csrf,
    ): JsonResponse {
        $session = $login->handle($request->validated());

        return response()->json(
            SessionPayloadResource::make(['session' => $session, 'csrfToken' => $csrf->derive($session->id)])
                ->resolve($request),
        );
    }

    public function forgotPassword(
        ForgotPasswordRequest $request,
        AccountTokenService $accountTokens,
        AuthMailer $mailer,
    ): JsonResponse {
        $user = User::query()->where('email', $request->validated('email'))->first();

        if ($user !== null && $user->password !== null) {
            $token = $accountTokens->issue($user, AccountToken::PURPOSE_PASSWORD_RESET);
            DB::afterCommit(fn () => $mailer->sendPasswordReset($user, $token));
        }

        return response()->json([], 202);
    }

    public function resetPassword(
        ResetPasswordRequest $request,
        ResetPassword $reset,
        CsrfTokenService $csrf,
    ): JsonResponse {
        $session = $reset->handle($request->validated());

        return response()->json(
            SessionPayloadResource::make(['session' => $session, 'csrfToken' => $csrf->derive($session->id)])
                ->resolve($request),
        );
    }

    public function changePassword(
        ChangePasswordRequest $request,
        ChangePassword $change,
    ): Response {
        $change->handle(
            $request->user(),
            $request->attributes->get('owner_session'),
            $request->validated(),
        );

        return response()->noContent();
    }

    public function logout(Request $request, SessionService $sessions): Response
    {
        $sessions->revoke($request->attributes->get('owner_session'));

        return response()->noContent();
    }

    public function verifyEmail(
        VerifyEmailRequest $request,
        VerifyEmail $verify,
    ): JsonResponse {
        $verifiedAt = $verify->handle($request->validated('token'));

        return response()->json(['emailVerifiedAt' => $verifiedAt->toIso8601String()]);
    }

    public function resendVerification(
        Request $request,
        AccountTokenService $accountTokens,
        AuthMailer $mailer,
    ): JsonResponse {
        $user = $request->user();
        $token = $accountTokens->issue($user, AccountToken::PURPOSE_EMAIL_VERIFICATION);
        DB::afterCommit(fn () => $mailer->sendVerification($user, $token));

        return response()->json([], 202);
    }

    public function destroy(
        DeleteAccountRequest $request,
        DeleteAccount $delete,
    ): Response {
        $delete->handle($request->user(), $request->validated());

        return response()->noContent();
    }

    public function oauthGoogleStart(GoogleOAuthService $google): JsonResponse
    {
        return response()->json(['authUrl' => $google->generateAuthUrl()]);
    }

    public function resolveSession(
        Request $request,
        CsrfTokenService $csrf,
    ): JsonResponse {
        $session = $request->attributes->get('owner_session');

        return response()->json(
            SessionPayloadResource::make(['session' => $session, 'csrfToken' => $csrf->derive($session->getKey())])
                ->resolve($request),
        );
    }

    public function oauthGoogleCallback(
        GoogleOAuthCallbackRequest $request,
        SignInWithGoogle $signIn,
        CsrfTokenService $csrf,
    ): JsonResponse {
        $attributes = $request->validated();
        $session = $signIn->handle($attributes['code'], $attributes['state']);

        return response()->json(
            SessionPayloadResource::make(['session' => $session, 'csrfToken' => $csrf->derive($session->id)])
                ->resolve($request),
        );
    }
}
