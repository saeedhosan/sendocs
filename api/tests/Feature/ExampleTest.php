<?php

test('the OpenAPI document is available', function (): void {
    $response = $this->get('/health');

    $response->assertOk();
});
