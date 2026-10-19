<?php

declare(strict_types=1);

it('serves API documentation without starting database-backed Laravel sessions', function (): void {
    config(['session.driver' => 'database']);

    $this->get('/docs')
        ->assertOk()
        ->assertSee('Scalar.createApiReference');

    $this->get('/docs/openapi.yaml')
        ->assertOk()
        ->assertHeader('Content-Type', 'text/yaml');
});
