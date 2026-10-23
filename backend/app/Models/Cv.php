<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cv extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'cvs';

    protected $fillable = [
        'candidat_id',
        'nom_fichier',
        'type_mime',
        'taille_octets',
        'url_stockage',
    ];

    public function candidat(): BelongsTo
    {
        return $this->belongsTo(Candidat::class, 'candidat_id');
    }

    public function analyses(): HasMany
    {
        return $this->hasMany(AnalyseCv::class, 'cv_id');
    }

    public function candidatures(): HasMany
    {
        return $this->hasMany(Candidature::class, 'cv_id');
    }
}
