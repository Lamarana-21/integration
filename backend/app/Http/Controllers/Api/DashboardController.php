<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Candidature;
use App\Models\Entreprise;
use App\Models\Offre;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Module 10.1 à 10.5 : Tableau de bord recruteur (E7)
     */
    public function recruiter(Request $request): JsonResponse
    {
        $user = $request->user();
        $entrepriseId = $user->entreprise_id;

        $offresActivesQuery = Offre::where('entreprise_id', $entrepriseId)->where('statut', 'PUBLIEE');
        $offresActivesCount = $offresActivesQuery->count();

        $candidaturesBaseQuery = Candidature::whereHas('offre', function ($q) use ($entrepriseId) {
            $q->where('entreprise_id', $entrepriseId);
        });

        $totalCandidatures = (clone $candidaturesBaseQuery)->count();
        $aTraiterCount = (clone $candidaturesBaseQuery)->where('statut', 'RECUE')->count();
        $enExamenCount = (clone $candidaturesBaseQuery)->where('statut', 'EN_EXAMEN')->count();
        $preselectionneesCount = (clone $candidaturesBaseQuery)->where('statut', 'PRESELECTIONNEE')->count();
        $entretiensCount = (clone $candidaturesBaseQuery)->where('statut', 'ENTRETIEN')->count();
        $accepteesCount = (clone $candidaturesBaseQuery)->where('statut', 'ACCEPTEE')->count();
        $refuseesCount = (clone $candidaturesBaseQuery)->where('statut', 'REFUSEE')->count();

        // Candidatures récentes avec score IA (Module 10.4)
        $recentCandidatures = (clone $candidaturesBaseQuery)
            ->with(['candidat.user', 'offre', 'analyse'])
            ->orderBy('created_at', 'desc')
            ->limit(6)
            ->get();

        // Mes offres avec compteurs (Module 10.2)
        $mesOffres = Offre::where('entreprise_id', $entrepriseId)
            ->withCount('candidatures')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // Taux de présélection (Module 10.5)
        $tauxPreselection = $totalCandidatures > 0 
            ? round((($preselectionneesCount + $entretiensCount + $accepteesCount) / $totalCandidatures) * 100) 
            : 0;

        return response()->json([
            'kpis' => [
                'offres_actives' => $offresActivesCount,
                'candidatures_total' => $totalCandidatures,
                'candidatures_a_traiter' => $aTraiterCount,
                'entretiens_prevus' => $entretiensCount,
                'taux_preselection_pct' => $tauxPreselection,
                'delai_moyen_jours' => 4,
            ],
            'statuts_repartition' => [
                'recues' => $aTraiterCount,
                'en_examen' => $enExamenCount,
                'preselectionnees' => $preselectionneesCount,
                'entretiens' => $entretiensCount,
                'acceptees' => $accepteesCount,
                'refusees' => $refuseesCount,
            ],
            'candidatures_recentes' => $recentCandidatures,
            'mes_offres' => $mesOffres,
        ]);
    }

    /**
     * Module 10.6 : Tableau de bord administrateur (E12, E14)
     */
    public function admin(Request $request): JsonResponse
    {
        $totalUsers = User::count();
        $usersParRole = [
            'admin' => User::whereHas('role', fn ($q) => $q->where('nom', 'ADMIN'))->count(),
            'recruteur' => User::whereHas('role', fn ($q) => $q->where('nom', 'RECRUTEUR'))->count(),
            'candidat' => User::whereHas('role', fn ($q) => $q->where('nom', 'CANDIDAT'))->count(),
        ];

        $totalEntreprises = Entreprise::count();
        $entreprisesActives = Entreprise::where('statut', 'ACTIVE')->count();

        $totalOffres = Offre::count();
        $offresPubliees = Offre::where('statut', 'PUBLIEE')->count();
        $totalCandidatures = Candidature::count();

        return response()->json([
            'kpis' => [
                'total_utilisateurs' => $totalUsers,
                'roles_repartition' => $usersParRole,
                'total_entreprises' => $totalEntreprises,
                'entreprises_actives' => $entreprisesActives,
                'total_offres' => $totalOffres,
                'offres_publiees' => $offresPubliees,
                'total_candidatures' => $totalCandidatures,
            ],
        ]);
    }
}
