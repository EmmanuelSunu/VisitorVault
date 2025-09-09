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
        Schema::table('visits', function (Blueprint $table) {
            // Add new columns if they don't exist
            if (!Schema::hasColumn('visits', 'company_id')) {
                $table->foreignId('company_id')->nullable()->constrained()->onDelete('set null');
            }
            if (!Schema::hasColumn('visits', 'host_id')) {
                $table->foreignId('host_id')->nullable()->constrained()->onDelete('set null');
            }
            if (!Schema::hasColumn('visits', 'status')) {
                $table->string('status')->default('pending'); // pending, approved, rejected
            }
            if (!Schema::hasColumn('visits', 'purpose')) {
                $table->string('purpose')->nullable();
            }
            if (!Schema::hasColumn('visits', 'notes')) {
                $table->text('notes')->nullable();
            }
            if (!Schema::hasColumn('visits', 'approved_at')) {
                $table->timestamp('approved_at')->nullable();
            }
            if (!Schema::hasColumn('visits', 'approved_by')) {
                $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            }
        });

        // Remove columns from visitors table if they exist
        Schema::table('visitors', function (Blueprint $table) {
            $columnsToDrop = [];

            $columns = ['company', 'host_name', 'host_email', 'host_phone', 'purpose', 'status', 'approved_at', 'approved_by'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('visitors', $column)) {
                    $columnsToDrop[] = $column;
                }
            }

            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('visitors', function (Blueprint $table) {
            $table->string('company')->nullable();
            $table->string('host_name')->nullable();
            $table->string('host_email')->nullable();
            $table->string('host_phone')->nullable();
            $table->string('purpose')->nullable();
            $table->string('status')->default('pending');
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
        });

        Schema::table('visits', function (Blueprint $table) {
            $table->dropForeign(['company_id']);
            $table->dropForeign(['host_id']);
            $table->dropForeign(['approved_by']);
            $table->dropColumn([
                'company_id',
                'host_id',
                'status',
                'purpose',
                'notes',
                'approved_at',
                'approved_by',
            ]);
        });
    }
};
