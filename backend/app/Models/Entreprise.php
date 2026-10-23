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
    ];

    public function recruteurs(): HasMany
    {
        return $this->hasMany(User::class, 'entreprise_id');
    }

    public function offres(): HasMany
    {
        return $this->hasMany(Offre::class, 'entreprise_id');
    }
}
