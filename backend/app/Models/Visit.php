<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Visit extends Model
{
    use HasFactory;

    protected $fillable = [
        'visitor_id',
        'company_id',
        'host_id',
        'visit_date',
        'check_in_time',
        'check_out_time',
        'status',
        'purpose',
        'notes',
        'badge_number',
        'approved_at',
        'approved_by'
    ];

    protected $casts = [
        'visit_date' => 'date',
        'check_in_time' => 'datetime',
        'check_out_time' => 'datetime',
        'approved_at' => 'datetime',
    ];

    public function visitor(): BelongsTo
    {
        return $this->belongsTo(Visitor::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function host(): BelongsTo
    {
        return $this->belongsTo(Host::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
