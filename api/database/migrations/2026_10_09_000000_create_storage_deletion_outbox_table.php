<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('storage_deletion_outbox', function (Blueprint $table): void {
            $table->id();
            $table->string('storage_key')->unique();
            $table->unsignedInteger('attempts')->default(0);
            $table->timestampTz('last_attempted_at')->nullable();
            $table->timestampTz('available_at')->useCurrent();
            $table->timestampTz('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('storage_deletion_outbox');
    }
};
