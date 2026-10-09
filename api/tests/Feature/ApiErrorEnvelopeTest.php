<?php

declare(strict_types=1);

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
