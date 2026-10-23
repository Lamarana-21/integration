<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Offre extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'titre',
        'description',
        'missions',
        'competences_requises',
        'type_contrat',
        'lieu',
        'salaire',
        'date_publication',
        'date_limite',
        'statut',
        'entreprise_id',
        'auteur_id',
    ];

    protected $casts = [
        'competences_requises' => 'array',
        'date_publication' => 'date',
        'date_limite' => 'date',
    ];

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'entreprise_id');
    }

    public function auteur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'auteur_id');
    }

    public function candidatures(): HasMany
    {
        return $this->hasMany(Candidature::class, 'offre_id');
    }

    // RM1: Visible aux candidats uniquement si PUBLIEE et date_limite non depassee
    public function scopePublieesEtActives(Builder $query): Builder
    {
        return $query->where('statut', 'PUBLIEE')
            ->where(function ($q) {
                $q->whereNull('date_limite')
                  ->orWhere('date_limite', '>=', Carbon::today()->toDateString());
            });
    }

    public function isExpired(): bool
    {
        if (!$this->date_limite) {
            return false;
        }

        return Carbon::parse($this->date_limite)->isPast() && !Carbon::parse($this->date_limite)->isToday();
    }
}
