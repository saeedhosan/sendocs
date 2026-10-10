<?php

declare(strict_types=1);

use App\Portal\Controllers\PortalController;
use App\Portal\Middleware\ResolveMagicLink;
use Illuminate\Support\Facades\Route;

Route::middleware([
    'throttle:portal.read',
    ResolveMagicLink::class,
])->group(function (): void {
    Route::get('portal/{token}', [PortalController::class, 'show'])
        ->name('portal.show');
});

Route::post('portal/{token}/items/{itemId}/file', [PortalController::class, 'upload'])
    ->middleware([
        'throttle:portal.upload',
        ResolveMagicLink::class,
    ])
    ->name('portal.items.file.store');
