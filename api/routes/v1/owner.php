<?php

declare(strict_types=1);

use App\Auth\Middleware\VerifyCsrfToken;
use App\DocumentRequests\Controllers\DocumentRequestController;
use Illuminate\Support\Facades\Route;

Route::post('requests', [DocumentRequestController::class, 'store'])
    ->middleware([VerifyCsrfToken::class, 'throttle:document-requests.write'])
    ->name('requests.store');
