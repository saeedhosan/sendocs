<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Auth;

abstract class TestCase extends BaseTestCase
{
    /**
     * Each simulated HTTP request needs a fresh RequestGuard.
     *
     * Laravel keeps resolved guards on the Auth manager, while feature tests
     * reuse one application instance for several requests.
     */
    public function call(...$arguments)
    {
        Auth::forgetGuards();

        return parent::call(...$arguments);
    }
}
