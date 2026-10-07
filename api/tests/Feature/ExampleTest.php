<?php

declare(strict_types=1);

test('the OpenAPI document is available', function (): void {
    $response = $this->get('/health');

    $response->assertOk();
});
