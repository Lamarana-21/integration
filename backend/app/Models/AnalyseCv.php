<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnalyseCv extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'analyses_cv';

    protected $fillable = [
        'cv_id',
        'candidature_id',
        'infos_extraites',
        'resume',
        'score_correspondance',
        'points_forts',
        'points_manquants',
        'niveau_confiance',
        'version_modele',
        'valide_par_recruteur',
    ];

    protected $casts = [
        'infos_extraites' => 'array',
        'points_forts' => 'array',
        'points_manquants' => 'array',
        'score_correspondance' => 'integer',
        'valide_par_recruteur' => 'boolean',
    ];

    public function cv(): BelongsTo
    {
        return $this->belongsTo(Cv::class, 'cv_id');
    }

    public function candidature(): BelongsTo
    {
        return $this->belongsTo(Candidature::class, 'candidature_id');
    }
}
