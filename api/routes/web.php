<?php

declare(strict_types=1);

use Illuminate\Contracts\View\Factory;
use Illuminate\Contracts\View\View;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\Support\Facades\Route;

Route::get('/docs/openapi.yaml', function () {
    $content = file_get_contents(base_path('docs/openapi.yaml'));

    return response($content)->header('Content-Type', 'text/yaml');
})->withoutMiddleware(StartSession::class);

Route::get('/docs', fn (): Factory|View => view('docs'))
    ->withoutMiddleware(StartSession::class);
