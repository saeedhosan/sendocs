<?php

declare(strict_types=1);

namespace App\Auth\Actions;

use App\Auth\Services\SessionService;
use App\Exceptions\ApiException;
use App\Models\RequestItem;
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
            // Serialize account deletion with creation of new owned requests.
            $lockedUser = User::query()
                ->whereKey($user->getKey())
                ->lockForUpdate()
                ->first();

            if (! $lockedUser instanceof User) {
                return;
            }

            // Lock every item, including empty ones, so an upload cannot insert
            // metadata after the cleanup keys have been collected.
            $itemIds = RequestItem::query()
                ->join('document_requests', 'document_requests.id', '=', 'request_items.request_id')
                ->where('document_requests.owner_id', $lockedUser->getKey())
                ->orderBy('request_items.id')
                ->lockForUpdate()
                ->pluck('request_items.id')
                ->all();

            $storageKeys = DB::table('documents')
                ->whereIn('request_item_id', $itemIds)
                ->pluck('storage_key')
                ->all();

            $this->storageDeletionOutbox->enqueue($storageKeys);

            $lockedUser->delete();
        });

        $this->sessions->forgetCookie();
    }
}
