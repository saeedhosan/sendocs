<?php

declare(strict_types=1);

namespace App\Auth\Actions;

use App\Auth\Services\SessionService;
use App\Exceptions\ApiException;
use App\Models\User;
use App\Storage\StorageDeletionOutbox;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

final readonly class DeleteAccount
{
    public function __construct(
        private SessionService $sessions,
        private StorageDeletionOutbox $storageDeletionOutbox,
    ) {}

    public function handle(User $user, array $attributes): void
    {
        if ($user->password === null) {
            throw ApiException::passwordNotSupported();
        }

        if (! Hash::check($attributes['password'], $user->password)) {
            throw ApiException::invalidCredentials();
        }

        if (! hash_equals($user->email, $attributes['confirm'])) {
            throw ApiException::validationFailed([
                'confirm' => ['The confirmation does not match the address on file.'],
            ]);
        }

        DB::transaction(function () use ($user): void {
            $storageKeys = DB::table('documents')
                ->join('request_items', 'request_items.id', '=', 'documents.request_item_id')
                ->join('document_requests', 'document_requests.id', '=', 'request_items.request_id')
                ->where('document_requests.owner_id', $user->getKey())
                ->pluck('documents.storage_key')
                ->all();

            $this->storageDeletionOutbox->enqueue($storageKeys);

            $user->delete();
        });

        $this->sessions->forgetCookie();
    }
}
