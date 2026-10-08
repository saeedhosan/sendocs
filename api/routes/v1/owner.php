<?php

declare(strict_types=1);

use App\Auth\Middleware\VerifyCsrfToken;
use App\DocumentRequests\Controllers\DocumentRequestController;
use Illuminate\Support\Facades\Route;

Route::get('requests', [DocumentRequestController::class, 'index'])
    ->middleware('throttle:document-requests.read')
    ->name('requests.index');

Route::post('requests', [DocumentRequestController::class, 'store'])
    ->middleware([VerifyCsrfToken::class, 'throttle:document-requests.write'])
    ->name('requests.store');

Route::get('requests/{requestId}', [DocumentRequestController::class, 'show'])
    ->middleware('throttle:document-requests.read')
    ->name('requests.show');
