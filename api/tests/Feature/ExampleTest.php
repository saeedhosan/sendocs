<?php

test('the OpenAPI document is available', function (): void {
    $response = $this->get('/docs/openapi.yaml');

    $response->assertOk();
});
