<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('request_items', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('request_id')->constrained('document_requests')->cascadeOnDelete();
            $table->string('label', 200);
            $table->unsignedSmallInteger('position');
            $table->timestampsTz();

            $table->unique(['request_id', 'position']);
            $table->index('request_id');
        });

        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement(
                'ALTER TABLE request_items ADD CONSTRAINT request_items_position_check CHECK (position BETWEEN 1 AND 10)'
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('request_items');
    }
};
