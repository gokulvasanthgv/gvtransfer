<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recipient_contacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->char('email_hash', 64);
            $table->text('name');
            $table->text('email');
            $table->timestamps();

            $table->unique(['user_id', 'email_hash']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recipient_contacts');
    }
};
