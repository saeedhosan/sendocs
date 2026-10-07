<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * An issued owner session. Only the SHA-256 hash of the cookie value is stored.
 *
 * @property \Illuminate\Support\Carbon $expires_at
 */
#[Fillable(['user_id', 'token_hash', 'expires_at'])]
class Session extends Model
{
    use HasUuids;

    public const UPDATED_AT = null;

    /**
     * The owner this session belongs to.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
        ];
    }
}
