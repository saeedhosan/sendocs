<?php

declare(strict_types=1);

use Illuminate\\Support\\Facades\\Route;
use RuntimeException;

it('returns the standard error envelope for an unknown API route', function (): void {
    $this->getJson('/api/v1/does-not-exist')
        ->assertNotFound()
        ->assertExactJson([
            'error' => [
                'code'    => 'not_found',
                'message' => 'Not found.',
            ],
        ]);
});

it('returns the standard error envelope when an API method is not allowed', function (): void {
    $this->getJson('/api/v1/auth/login')
        ->assertStatus(405)
        ->assertExactJson([
            'error' => [
                'code'    => 'method_not_allowed',
                'message' => 'Method not allowed.',
            ],
        ]);
});


it('returns the standard internal error envelope for unexpected API exceptions', function (): void {
    Route::get('/api/v1/test-unexpected-error', function (): void {
        throw new RuntimeException('Sensitive database connection details.');
    });

    $response = $this->getJson('/api/v1/test-unexpected-error');

    $response
        ->assertInternalServerError()
        ->assertExactJson([
            'error' => [
                'code'    => 'internal_error',
                'message' => 'Something went wrong. Try again.',
            ],
        ]);

    expect($response->content())->not->toContain('Sensitive database connection details.');
});
