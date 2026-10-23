<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Candidat extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'utilisateur_id',
        'telephone',
        'ville',
        'resume',
        'competences',
        'experiences',
        'formations',
        'langues',
        'disponibilite',
    ];

    protected $casts = [
        'competences' => 'array',
        'experiences' => 'array',
        'formations' => 'array',
        'langues' => 'array',
        'disponibilite' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'utilisateur_id');
    }

    public function cvs(): HasMany
    {
        return $this->hasMany(Cv::class, 'candidat_id');
    }

    public function candidatures(): HasMany
    {
        return $this->hasMany(Candidature::class, 'candidat_id');
    }
}
