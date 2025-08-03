<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('visitors', function (Blueprint $table) {
            $table->id();
            $table->string('f_name');
            $table->string('l_name');
            $table->string('purpose')->nullable();
            $table->string('phone')->unique();
            $table->string('email')->nullable()->unique();
            $table->string('company')->nullable();
            $table->string('h_name')->nullable();
            $table->string('h_email')->nullable();
            $table->string('h_phone')->nullable();
            $table->string('id_type')->nullable();
            $table->string('id_number')->nullable();
            $table->string('pic')->nullable();
            $table->string('id_pic')->nullable();
            $table->string('status')->default('pending'); // pending, approved, rejected
            $table->timestamp('visit_date')->nullable();
            $table->timestamp('check_in_time')->nullable();
            $table->timestamp('check_out_time')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null'); // Foreign key to users table for host
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('visitors');
    }
};
