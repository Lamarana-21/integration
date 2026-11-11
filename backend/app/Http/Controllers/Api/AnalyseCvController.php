<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnalyseCv;
use App\Models\Cv;
use App\Services\AiCvAnalysisService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyseCvController extends Controller
{
    protected AiCvAnalysisService $aiService;

    public function __construct(AiCvAnalysisService $aiService)
    {
        $this->aiService = $aiService;
    }

    
    public function relancer(string $id): JsonResponse
    {
        $ancienne = AnalyseCv::with(['cv.candidat', 'candidature.offre'])->findOrFail($id);

        $nouvelle = $this->aiService->analyser($ancienne->cv, $ancienne->candidature);

        return response()->json([
            'message' => 'Analyse IA actualisée avec succès',
            'analyse' => $nouvelle,
        ]);
    }

    public function analyserCv(Request $request, string $id): JsonResponse
    {
        $cv = Cv::with('candidat')->findOrFail($id);
        abort_unless($request->user()->candidat?->id === $cv->candidat_id || $request->user()->isAdmin(), 403);

        $analyse = $this->aiService->analyser($cv);

        return response()->json([
            'message' => 'CV analysé avec succès',
            'analyse' => $analyse,
        ], 201);
    }

    /**
     * Module 9.6 : Corriger les informations extraites par l'IA
     */
    public function corriger(Request $request, string $id): JsonResponse
    {
        $analyse = AnalyseCv::findOrFail($id);

        $validated = $request->validate([
            'infos_extraites' => 'required|array',
            'resume' => 'nullable|string',
            'points_forts' => 'nullable|array',
            'points_manquants' => 'nullable|array',
        ]);

        $analyse->update([
            'infos_extraites' => $validated['infos_extraites'],
            'resume' => $validated['resume'] ?? $analyse->resume,
            'points_forts' => $validated['points_forts'] ?? $analyse->points_forts,
            'points_manquants' => $validated['points_manquants'] ?? $analyse->points_manquants,
            'valide_par_recruteur' => true,
        ]);

        return response()->json([
            'message' => 'Informations extraites corrigées et validées par le recruteur',
            'analyse' => $analyse,
        ]);
    }

    
    public function valider(string $id): JsonResponse
    {
        $analyse = AnalyseCv::findOrFail($id);
        $analyse->update(['valide_par_recruteur' => 1]);

        return response()->json([
            'message' => 'Analyse validée',
            'analyse' => $analyse,
        ]);
    }
}
