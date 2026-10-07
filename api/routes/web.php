<?php

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;

Route::get('/docs/openapi.yaml', function () {
    $content = file_get_contents(base_path('docs/openapi.yaml'));
    return response($content)->header('Content-Type', 'text/yaml');
});

Route::get('/docs', function () {
    return view('docs');
});
