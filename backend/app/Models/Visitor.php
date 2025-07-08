<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Visitor extends Model
{
    /** @use HasFactory<\Database\Factories\VisitorFactory> */
    use HasFactory;

    protected $fillable = [
        'f_name',
        'l_name',
        'purpose',
        'phone',
        'email',
        'company',
        'h_name',
        'h_email',
        'h_phone',
        'id_type',
        'id_number',
        'pic',
        'id_pic',
        'status',
        'visit_date',
        'check_in_time',
        'check_out_time',
        'notes',
        'user_id'
    ];

    protected $casts = [
        'visit_date' => 'datetime',
        'check_in_time' => 'datetime',
        'check_out_time' => 'datetime',
    ];

    public function host(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
