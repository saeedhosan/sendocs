<?php

use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::prefix('auth')->group(base_path('routes/v1/auth.php'));
    Route::middleware('owner')->group(base_path('routes/v1/owner.php'));
});
