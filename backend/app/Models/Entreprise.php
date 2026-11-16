<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Entreprise extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'entreprises';

    protected $fillable = [
        'nom',
        'secteur',
        'ville',
        'pays',
        'site_web',
        'description',
        'logo_url',
        'statut',
        'max_candidatures_actives_par_candidat',
    ];

    protected $casts = [
        'max_candidatures_actives_par_candidat' => 'integer',
    ];

    public function recruteurs(): HasMany
    {
        return $this->hasMany(User::class, 'entreprise_id');
    }

    public function offres(): HasMany
    {
        return $this->hasMany(Offre::class, 'entreprise_id');
    }

    /**
     * Vérifie si l'entreprise a configuré une limite de candidatures actives.
     */
    public function hasActiveApplicationsLimit(): bool
    {
        return $this->max_candidatures_actives_par_candidat !== null && $this->max_candidatures_actives_par_candidat > 0;
    }
}
