<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Notifications\Notifiable;

class Visitor extends Model
{
    /** @use HasFactory<\Database\Factories\VisitorFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'f_name',
        'l_name',
        'phone',
        'email',
        'id_type',
        'id_number',
        'pic',
        'id_pic'
    ];

    protected $casts = [];

    public function visits(): HasMany
    {
        return $this->hasMany(Visit::class);
    }
}
