<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::prefix('auth')->group(base_path('routes/v1/auth.php'));
    Route::group(base_path('routes/v1/portal.php'));
    Route::middleware('auth:owner')->group(base_path('routes/v1/owner.php'));
});
