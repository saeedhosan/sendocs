<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A link between an owner and one external identity provider.
 *
 * The unique (provider, provider_id) pair is the only lookup a social sign-in
 * needs, and it never stores a token from the provider.
 */
#[Fillable(['user_id', 'provider', 'provider_id'])]
class AuthIdentity extends Model
{
    use HasUuids;

    public const PROVIDER_GOOGLE = 'google';

    /**
     * The owner this identity belongs to.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
