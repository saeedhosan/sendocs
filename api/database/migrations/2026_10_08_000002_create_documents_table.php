<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('request_item_id')
                ->unique()
                ->constrained('request_items')
                ->cascadeOnDelete();
            $table->string('storage_key', 500);
            $table->string('original_name', 255);
            $table->string('mime_type', 255);
            $table->unsignedBigInteger('size_bytes');
            $table->char('sha256', 64);
            $table->timestampTz('uploaded_at');

            $table->index('request_item_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
