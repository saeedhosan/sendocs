<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['request_item_id', 'storage_key', 'original_name', 'mime_type', 'size_bytes', 'sha256', 'uploaded_at'])]
/**
 * @property \Illuminate\Support\Carbon $uploaded_at
 */
class Document extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'size_bytes' => 'integer',
            'uploaded_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<RequestItem, $this> */
    public function requestItem(): BelongsTo
    {
        return $this->belongsTo(RequestItem::class, 'request_item_id');
    }
}
