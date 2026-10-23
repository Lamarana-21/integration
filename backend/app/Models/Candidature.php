<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Candidature extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'candidat_id',
        'offre_id',
        'cv_id',
        'lettre_motivation',
        'message',
        'statut',
        'commentaire_recruteur',
    ];

    public function candidat(): BelongsTo
    {
        return $this->belongsTo(Candidat::class, 'candidat_id');
    }

    public function offre(): BelongsTo
    {
        return $this->belongsTo(Offre::class, 'offre_id');
    }

    public function cv(): BelongsTo
    {
        return $this->belongsTo(Cv::class, 'cv_id');
    }

    public function analyse(): HasOne
    {
        return $this->hasOne(AnalyseCv::class, 'candidature_id');
    }

    public function notesInternes(): HasMany
    {
        return $this->hasMany(NoteInterne::class, 'candidature_id');
    }

    // RM5: Un candidat peut retirer sa candidature tant qu'elle n'est ni ACCEPTEE ni REFUSEE
    public function canBeWithdrawn(): bool
    {
        return !in_array($this->statut, ['ACCEPTEE', 'REFUSEE', 'RETIREE']);
    }
}
