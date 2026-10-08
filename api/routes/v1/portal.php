<?php

declare(strict_types=1);

use App\Portal\Controllers\PortalController;
use App\Portal\Middleware\ResolveMagicLink;
use Illuminate\Support\Facades\Route;

Route::get('portal/{token}', [PortalController::class, 'show'])
    ->middleware([
        'throttle:portal.read',
        ResolveMagicLink::class,
    ])
    ->name('portal.show');
