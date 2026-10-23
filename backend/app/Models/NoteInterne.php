<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NoteInterne extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'notes_internes';

    protected $fillable = [
        'auteur_id',
        'candidature_id',
        'contenu',
        'etiquettes',
    ];

    protected $casts = [
        'etiquettes' => 'array',
    ];

    public function auteur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'auteur_id');
    }

    public function candidature(): BelongsTo
    {
        return $this->belongsTo(Candidature::class, 'candidature_id');
    }
}
