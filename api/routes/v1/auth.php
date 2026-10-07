<?php

use App\Auth\Controllers\AuthController;
use App\Auth\Middleware\VerifyCsrfToken;
use Illuminate\Support\Facades\Route;

Route::post('register', [AuthController::class, 'register'])
    ->middleware('throttle:auth.register')
    ->name('auth.register');

Route::post('login', [AuthController::class, 'login'])
    ->middleware('throttle:auth.login')
    ->name('auth.login');

Route::post('logout', [AuthController::class, 'logout'])
    ->middleware(['auth:owner', VerifyCsrfToken::class, 'throttle:auth.logout'])
    ->name('auth.logout');

Route::post('password/forgot', [AuthController::class, 'forgotPassword'])
    ->middleware('throttle:auth.password.forgot')
    ->name('auth.password.forgot');

Route::post('password/reset', [AuthController::class, 'resetPassword'])
    ->middleware('throttle:auth.password.reset')
    ->name('auth.password.reset');

Route::post('password/change', [AuthController::class, 'changePassword'])
    ->middleware(['auth:owner', VerifyCsrfToken::class, 'throttle:auth.password.change'])
    ->name('auth.password.change');

Route::delete('account', [AuthController::class, 'destroy'])
    ->middleware(['auth:owner', VerifyCsrfToken::class, 'throttle:auth.account.destroy'])
    ->name('auth.account.destroy');

Route::get('email/verify', [AuthController::class, 'verifyEmail'])
    ->middleware('throttle:auth.email.verify')
    ->name('auth.email.verify');

Route::post('email/resend', [AuthController::class, 'resendVerification'])
    ->middleware(['auth:owner', VerifyCsrfToken::class, 'throttle:auth.email.resend'])
    ->name('auth.email.resend');

Route::get('session', [AuthController::class, 'resolveSession'])
    ->middleware(['auth:owner', 'throttle:auth.session'])
    ->name('auth.session');

Route::get('oauth/google', [AuthController::class, 'oauthGoogleStart'])
    ->middleware('throttle:auth.oauth')
    ->name('auth.oauth.google');

Route::get('oauth/google/callback', [AuthController::class, 'oauthGoogleCallback'])
    ->middleware('throttle:auth.oauth')
    ->name('auth.oauth.google.callback');
