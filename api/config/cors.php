<?php

return [
    'paths' => ['api/*', 'health'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter(explode(',', env('FRONTEND_URLS', ''))),

    'allowed_origins_patterns' => array_filter(explode(',', env('FRONTEND_URL_PATTERNS', ''))),

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];