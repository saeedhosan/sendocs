<?php

declare(strict_types=1);

namespace App\DocumentRequests\Actions;

use App\Exceptions\ApiException;
use App\Models\DocumentRequest;
use App\Models\User;
use Illuminate\Pagination\Cursor;
use Illuminate\Pagination\CursorPaginator;

final readonly class ListRequests
{
    public function handle(User $owner, int $limit, ?string $cursor): CursorPaginator
    {
        if ($cursor !== null) {
            $decoded    = Cursor::fromEncoded($cursor);
            $parameters = $decoded?->toArray();

            if (
                $parameters === null
                || ! array_key_exists('created_at', $parameters)
                || ! array_key_exists('id', $parameters)
                || ! array_key_exists('_pointsToNextItems', $parameters)
                || ! is_string($parameters['created_at'])
                || ! is_string($parameters['id'])
                || ! is_bool($parameters['_pointsToNextItems'])
            ) {
                throw new ApiException(
                    'validation_failed',
                    'Check the highlighted fields.',
                    422,
                    ['cursor' => 'The cursor is invalid.'],
                );
            }
        }

        return DocumentRequest::query()
            ->where('owner_id', $owner->getKey())
            ->with('items.document')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->cursorPaginate($limit, ['*'], 'cursor', $cursor);
    }
}
