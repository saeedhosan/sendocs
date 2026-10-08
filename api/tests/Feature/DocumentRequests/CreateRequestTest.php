<?php

declare(strict_types=1);

use App\Auth\Services\CsrfTokenService;
use App\Auth\Services\SessionService;
use App\Models\RequestItem;
use App\Models\User;

function createRequestAsOwner(array $attributes = [])
{
    $owner = User::factory()->create();
    $session = app(SessionService::class)->issue($owner);

    test()->withUnencryptedCookie(sessionCookieName(), collect(Cookie::getQueuedCookies())->last()->getValue());
    Auth::forgetGuards();

    return [
        'response' => test()->postJson(
            '/api/v1/requests',
            array_replace_recursive([
                'title' => 'Tax Documents',
                'items' => [
                    ['label' => 'Passport'],
                    ['label' => 'Bank Statement'],
                ],
            ], $attributes),
            ['X-CSRF-Token' => app(CsrfTokenService::class)->derive($session->getKey())],
        ),
        'owner' => $owner,
    ];
}

test('creates a request with ordered items and returns the magic link once', function (): void {
    $result = createRequestAsOwner([
        'title' => '  Tax   Documents  ',
        'items' => [
            ['label' => '  Passport  '],
            ['label' => 'Bank   Statement'],
        ],
    ]);

    $response = $result['response'];

    $response->assertCreated()
        ->assertJsonPath('request.title', 'Tax Documents')
        ->assertJsonPath('request.status', 'waiting')
        ->assertJsonPath('request.uploaded', 0)
        ->assertJsonPath('request.total', 2)
        ->assertJsonPath('request.items.0.label', 'Passport')
        ->assertJsonPath('request.items.0.position', 1)
        ->assertJsonPath('request.items.1.label', 'Bank Statement')
        ->assertJsonPath('request.items.1.position', 2)
        ->assertJsonPath('request.items.0.state', 'waiting')
        ->assertJsonPath('request.items.0.document', null)
        ->assertJsonPath('link.expiresAt', fn ($value) => is_string($value))
        ->assertJsonStructure([
            'request' => ['id', 'title', 'status', 'uploaded', 'total', 'createdAt', 'expiresAt', 'revokedAt', 'items'],
            'link' => ['url', 'expiresAt'],
        ]);

    $token = basename((string) $response->json('link.url'));

    expect($token)
        ->toMatch('/^[A-Za-z0-9_-]{43}$/')
        ->and($response->json('link.url'))->toStartWith(rtrim((string) config('app.url'), '/').'/portal/');

    $request = \App\Models\DocumentRequest::query()->sole();
    expect($request->owner_id)->toBe($result['owner']->getKey())
        ->and($request->token_hash)->toBe(hash('sha256', $token))
        ->and($request->token_hash)->not->toBe($token)
        ->and($request->items()->count())->toBe(2);
});

test('requires an authenticated owner and csrf token', function (): void {
    test()->postJson('/api/v1/requests', [
        'title' => 'Tax Documents',
        'items' => [['label' => 'Passport']],
    ])->assertStatus(401)->assertJsonPath('error.code', 'unauthenticated');

    $owner = User::factory()->create();
    $session = app(SessionService::class)->issue($owner);
    test()->withUnencryptedCookie(sessionCookieName(), collect(Cookie::getQueuedCookies())->last()->getValue());
    Auth::forgetGuards();

    test()->postJson('/api/v1/requests', [
        'title' => 'Tax Documents',
        'items' => [['label' => 'Passport']],
    ])->assertStatus(403)->assertJsonPath('error.code', 'csrf_failed');
});

test('rejects invalid titles and item counts', function (): void {
    foreach (['', '   ', str_repeat('a', 201)] as $title) {
        createRequestAsOwner(['title' => $title])['response']->assertStatus(422);
    }

    foreach ([[], array_fill(0, 11, ['label' => 'Item'])] as $items) {
        createRequestAsOwner(['items' => $items])['response']->assertStatus(422);
    }

    createRequestAsOwner(['title' => str_repeat('a', 200), 'items' => [['label' => 'Item']]])['response']->assertCreated();
});

test('accepts one and ten items and preserves submitted order', function (): void {
    createRequestAsOwner(['items' => [['label' => 'Only item']]])['response']->assertCreated();

    $items = array_map(fn (int $number): array => ['label' => "Item {$number}"], range(1, 10));
    $result = createRequestAsOwner(['items' => $items]);

    $result['response']->assertCreated();

    expect(RequestItem::query()->orderBy('position')->pluck('position')->all())->toBe(range(1, 10))
        ->and(RequestItem::query()->orderBy('position')->pluck('label')->all())->toBe(array_column($items, 'label'));
});

test('allows duplicate labels', function (): void {
    $result = createRequestAsOwner([
        'items' => [
            ['label' => 'Document'],
            ['label' => 'Document'],
        ],
    ]);

    $result['response']->assertCreated();

    expect(RequestItem::query()->pluck('label')->all())->toBe(['Document', 'Document']);
});

test('rolls back the request and items when an item insert fails', function (): void {
    RequestItem::creating(static function (): void {
        throw new RuntimeException('item insert failed');
    });

    $result = createRequestAsOwner();
    $result['response']->assertStatus(500);

    expect(\App\Models\DocumentRequest::query()->count())->toBe(0)
        ->and(RequestItem::query()->count())->toBe(0);
});

test('rate limits request creation to 120 attempts per minute per owner', function (): void {
    $owner = User::factory()->create();
    $session = app(SessionService::class)->issue($owner);
    test()->withUnencryptedCookie(sessionCookieName(), collect(Cookie::getQueuedCookies())->last()->getValue());
    Auth::forgetGuards();
    $csrf = app(CsrfTokenService::class)->derive($session->getKey());

    foreach (range(1, 120) as $number) {
        test()->postJson('/api/v1/requests', [
            'title' => "Request {$number}",
            'items' => [['label' => 'Passport']],
        ], ['X-CSRF-Token' => $csrf])->assertCreated();
    }

    test()->postJson('/api/v1/requests', [
        'title' => 'Request 121',
        'items' => [['label' => 'Passport']],
    ], ['X-CSRF-Token' => $csrf])->assertStatus(429)->assertJsonPath('error.code', 'rate_limited');
});
