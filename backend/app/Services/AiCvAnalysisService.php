<?php

namespace App\Services;

use App\Models\AnalyseCv;
use App\Models\Candidature;
use App\Models\Cv;
use App\Models\Offre;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiCvAnalysisService
{
    protected string $modelVersion = 'Gemini-3.8-Flash / ATS-Strict';

    /**
     * Analyse un CV pour une candidature donnée (ou CV autonome)
     */
    public function analyser(Cv $cv, ?Candidature $candidature = null): AnalyseCv
    {
        $offre = $candidature?->offre;

        // 1. Tenter l'analyse approfondie avec Google Gemini API (avec timeout court pour éviter les blocages)
        $geminiResult = $this->analyserAvecGemini($cv, $offre);

        if ($geminiResult !== null) {
            $analyse = AnalyseCv::create([
                'cv_id' => $cv->id,
                'candidature_id' => $candidature?->id,
                'infos_extraites' => $geminiResult['infos_extraites'],
                'resume' => $geminiResult['resume'],
                'score_correspondance' => $geminiResult['score'],
                'points_forts' => $geminiResult['points_forts'],
                'points_manquants' => $geminiResult['points_manquants'],
                'niveau_confiance' => $geminiResult['niveau_confiance'],
                'version_modele' => 'Gemini-3.8-Flash',
                'valide_par_recruteur' => false,
            ]);

            Log::info("Analyse CV effectuée via Gemini pour CV: {$cv->id}, Score: {$geminiResult['score']}");
            return $analyse;
        }

        // 2. Moteur de validation stricte en local (Parseur de contenu binaire + détection de faux CV)
        return $this->analyseLocaleStricte($cv, $candidature);
    }

    /**
     * Analyse multimodale Gemini
     */
    protected function analyserAvecGemini(Cv $cv, ?Offre $offre): ?array
    {
        $apiKey = env('GEMINI_API_KEY');
        if (empty($apiKey) || empty($cv->contenu_base64)) {
            return null;
        }

        $base64 = $cv->contenu_base64;
        if (str_contains($base64, ',')) {
            $base64 = explode(',', $base64)[1];
        }

        $offreTitre = $offre ? $offre->titre : 'Poste non spécifié';
        $offreSkills = $offre && !empty($offre->competences_requises)
            ? implode(', ', $offre->competences_requises)
            : 'Compétences requises';

        $prompt = <<<PROMPT
Tu es un évaluateur ATS et recruteur très rigoureux.
Analyse le document PDF joint par rapport à cette offre d'emploi :
- Poste visé : {$offreTitre}
- Compétences requises : {$offreSkills}

RÈGLES STRICTES :
1. VÉRIFICATION DU TYPE DE DOCUMENT :
   - Est-ce un Curriculum Vitæ professionnel ?
   - Si le document est un TP, des notes de cours, une facture, un texte quelconque qui n'a pas la structure d'un CV : 'est_cv' DOIT ÊTRE FAUX (false), 'score' DOIT ÊTRE 0, 'niveau_confiance' DOIT ÊTRE 'FAIBLE'.
   - 'resume' : "Document non conforme : Le fichier fourni ne constitue pas un curriculum vitæ (absence de parcours professionnel et de formation structurés)."
2. SI C'EST UN VRAI CV :
   - Extrais uniquement les vraies compétences et expériences du document.
   - Calcule le score réel par rapport aux compétences ({$offreSkills}).

Format JSON strict sans balises markdown :
{
  "est_cv": boolean,
  "score": integer (0 à 100),
  "resume": "résumé clair",
  "points_forts": ["point 1"],
  "points_manquants": ["point 1"],
  "niveau_confiance": "FAIBLE" | "MOYEN" | "ELEVE",
  "infos_extraites": {
    "competences": ["comp1"],
    "experiences": [{"poste": "...", "employeur": "...", "dates": "..."}],
    "formations": [{"diplome": "...", "ecole": "...", "annee": "..."}],
    "langues": ["Français", "Anglais"]
  }
}
PROMPT;

        try {
            // Utiliser le modèle stable gemini-3.8-flash recommandé par Google AI Studio
            $response = Http::timeout(8)
                ->withoutVerifying()
                ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={$apiKey}", [
                    'contents' => [
                        [
                            'parts' => [
                                ['inlineData' => ['mimeType' => 'application/pdf', 'data' => $base64]],
                                ['text' => $prompt],
                            ],
                        ],
                    ],
                    'generationConfig' => [
                        'responseMimeType' => 'application/json',
                        'temperature' => 0.1,
                    ],
                ]);

            if ($response->successful()) {
                $candidates = $response->json('candidates', []);
                $textResult = $candidates[0]['content']['parts'][0]['text'] ?? '';
                if (!empty($textResult)) {
                    $json = json_decode(trim($textResult), true);
                    if (is_array($json) && isset($json['score'])) {
                        return [
                            'est_cv' => (bool) ($json['est_cv'] ?? true),
                            'score' => max(0, min(100, (int) $json['score'])),
                            'resume' => $json['resume'] ?? 'Analyse effectuée avec succès.',
                            'points_forts' => is_array($json['points_forts'] ?? null) ? $json['points_forts'] : [],
                            'points_manquants' => is_array($json['points_manquants'] ?? null) ? $json['points_manquants'] : [],
                            'niveau_confiance' => $json['niveau_confiance'] ?? 'MOYEN',
                            'infos_extraites' => is_array($json['infos_extraites'] ?? null) ? $json['infos_extraites'] : [
                                'competences' => [],
                                'experiences' => [],
                                'formations' => [],
                                'langues' => [],
                            ],
                        ];
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::info("Gemini indisponible ou timeout, bascule sur l'analyseur ATS local : " . $e->getMessage());
        }

        return null;
    }

    /**
     * Analyseur ATS local strict : extrait le texte réel du PDF et vérifie la validité du CV
     */
    protected function analyseLocaleStricte(Cv $cv, ?Candidature $candidature): AnalyseCv
    {
        $candidat = $cv->candidat;
        $offre = $candidature?->offre;

        // 1. Extraire le texte réel contenu dans le PDF
        $texteExtrait = $this->extraireTextePdf($cv);

        // 2. Détecter si le document est un vrai CV ou un document quelconque (TP, rapport, cours, etc.)
        $validationCv = $this->validerConformiteCv($cv, $texteExtrait);

        if (!$validationCv['est_valide']) {
            return AnalyseCv::create([
                'cv_id' => $cv->id,
                'candidature_id' => $candidature?->id,
                'infos_extraites' => [
                    'competences' => [],
                    'experiences' => [],
                    'formations' => [],
                    'langues' => [],
                ],
                'resume' => "Document non conforme : Le fichier « {$cv->nom_fichier} » ne possède pas la structure d'un curriculum vitæ. " . $validationCv['motif'],
                'score_correspondance' => 0,
                'points_forts' => [],
                'points_manquants' => [
                    "Document non reconnu comme un CV professionnel (score: 0%).",
                    "Veuillez déposer un document contenant vos expériences, formations et compétences."
                ],
                'niveau_confiance' => 'FAIBLE',
                'version_modele' => $this->modelVersion,
                'valide_par_recruteur' => false,
            ]);
        }

        // 3. Si c'est un vrai CV : rechercher les vraies compétences dans le texte extrait
        $requises = array_map('strtolower', $offre->competences_requises ?? []);
        $texteLower = strtolower($texteExtrait);

        $correspondances = [];
        $manquantes = [];

        foreach ($requises as $req) {
            $pattern = '/\b' . preg_quote($req, '/') . '\b/i';
            if (preg_match($pattern, $texteLower) || str_contains($texteLower, $req)) {
                $correspondances[] = ucfirst($req);
            } else {
                $manquantes[] = ucfirst($req);
            }
        }

        // Si le texte est très court ou ne mentionne aucune compétence du profil
        $totalReq = max(1, count($requises));
        $matchRate = count($correspondances) / $totalReq;

        if (count($correspondances) === 0) {
            return AnalyseCv::create([
                'cv_id' => $cv->id,
                'candidature_id' => $candidature?->id,
                'infos_extraites' => [
                    'competences' => [],
                    'experiences' => [],
                    'formations' => [],
                    'langues' => [],
                ],
                'resume' => "Adéquation nulle : Le CV déposé (« {$cv->nom_fichier} ») ne mentionne aucune des compétences exigées pour le poste « {$offre?->titre} ».",
                'score_correspondance' => 0,
                'points_forts' => [],
                'points_manquants' => array_map(fn($m) => "Compétence requise absente du document : {$m}", $manquantes),
                'niveau_confiance' => 'MOYEN',
                'version_modele' => $this->modelVersion,
                'valide_par_recruteur' => false,
            ]);
        }

        $score = (int) round($matchRate * 85 + 10);
        $score = min(96, max(15, $score));

        return AnalyseCv::create([
            'cv_id' => $cv->id,
            'candidature_id' => $candidature?->id,
            'infos_extraites' => [
                'competences' => $correspondances,
                'experiences' => $candidat?->experiences ?? [],
                'formations' => $candidat?->formations ?? [],
                'langues' => $candidat?->langues ?? ['Français', 'Anglais'],
            ],
            'resume' => "Profil en adéquation partielle avec l'offre « {$offre?->titre} ». " . count($correspondances) . " sur " . count($requises) . " compétence(s) clé(s) validée(s) dans le document.",
            'score_correspondance' => $score,
            'points_forts' => array_map(fn($c) => "Compétence validée dans le CV : {$c}", $correspondances),
            'points_manquants' => array_map(fn($c) => "Compétence absente du CV : {$c}", $manquantes),
            'niveau_confiance' => count($correspondances) >= 2 ? 'ELEVE' : 'MOYEN',
            'version_modele' => $this->modelVersion,
            'valide_par_recruteur' => false,
        ]);
    }

    /**
     * Extraction textuelle brute depuis les flux PDF binaires (décompresse les flux FlateDecode et les flux texte)
     */
    protected function extraireTextePdf(Cv $cv): string
    {
        $base64 = $cv->contenu_base64 ?? '';
        if (empty($base64)) {
            return '';
        }

        if (str_contains($base64, ',')) {
            $base64 = explode(',', $base64)[1];
        }

        $raw = base64_decode($base64);
        if (!$raw || strlen($raw) < 10) {
            return '';
        }

        $texte = '';

        // 1. Décompression des streams PDF compressés (FlateDecode)
        if (preg_match_all('/stream[\r\n]+(.*?)[\r\n]+endstream/is', $raw, $matches)) {
            foreach ($matches[1] as $stream) {
                $uncompressed = @gzuncompress($stream);
                if ($uncompressed === false) {
                    $uncompressed = @gzinflate($stream);
                }
                if ($uncompressed !== false) {
                    // Extraire le texte entre parenthèses (...) Tj ou [(...)] TJ
                    if (preg_match_all('/\((.*?)\)\s*T[jJ]/s', $uncompressed, $tMatches)) {
                        $texte .= ' ' . implode(' ', $tMatches[1]);
                    }
                    if (preg_match_all('/\[(.*?)\]\s*TJ/s', $uncompressed, $tjMatches)) {
                        foreach ($tjMatches[1] as $arr) {
                            if (preg_match_all('/\((.*?)\)/s', $arr, $subMatches)) {
                                $texte .= ' ' . implode('', $subMatches[1]);
                            }
                        }
                    }
                }
            }
        }

        // 2. Extraire les chaînes texte en clair si non compressées
        if (preg_match_all('/\(([^\)]{3,})\)\s*T[jJ]/s', $raw, $tMatches)) {
            $texte .= ' ' . implode(' ', $tMatches[1]);
        }

        // 3. Fallback caractères alphanumériques lisibles
        if (empty(trim($texte))) {
            $filtered = preg_replace('/[^a-zA-Z0-9\sÀ-ÿ\.\,\-\_\:\;\@\/\(\)]/', ' ', $raw);
            $filtered = preg_replace('/\s+/', ' ', $filtered);
            $texte = trim($filtered);
        }

        return $texte;
    }

    /**
     * Valide si le document est un vrai CV professionnel ou un faux document
     */
    protected function validerConformiteCv(Cv $cv, string $texte): array
    {
        $nomFichier = strtolower($cv->nom_fichier ?? '');

        // 1. Rejet par nom de fichier suspect (TP de cours, devoir, rapport, projet étudiant, etc.)
        $motsRejet = ['tp_', 'tp-', 'tp.', 'devoir', 'cours', 'facture', 'invoice', 'exercice', 'rapport_stage'];
        foreach ($motsRejet as $motif) {
            if (str_contains($nomFichier, $motif)) {
                return [
                    'est_valide' => false,
                    'motif' => "Le nom du fichier (« {$cv->nom_fichier} ») indique un document académique ou administratif non lié à un CV.",
                ];
            }
        }

        // 2. Si le texte extrait est vide ou quasi-vide (< 40 caractères)
        if (strlen(trim($texte)) < 40) {
            return [
                'est_valide' => false,
                'motif' => "Le document ne contient aucun contenu textuel indexable ou exploitable.",
            ];
        }

        // 3. Vérification des piliers structurels d'un CV
        $texteLower = strtolower($texte);
        $piliers = [
            'experience' => ['expérience', 'experience', 'parcours', 'emploi', 'poste', 'stage', 'missions'],
            'formation' => ['formation', 'diplôme', 'diplome', 'études', 'etudes', 'université', 'universite', 'licence', 'master', 'bac', 'école', 'ecole'],
            'competence' => ['compétence', 'competence', 'skills', 'technologies', 'outils', 'connaissances', 'langages'],
            'contact' => ['email', 'mail', 'tél', 'tel', 'téléphone', 'adresse', 'contact', '@'],
        ];

        $piliersDetectes = 0;
        foreach ($piliers as $categorie => $mots) {
            foreach ($mots as $mot) {
                if (str_contains($texteLower, $mot)) {
                    $piliersDetectes++;
                    break;
                }
            }
        }

        // Pour être un CV valide, le document doit comporter au moins 2 piliers structurels
        if ($piliersDetectes < 2) {
            return [
                'est_valide' => false,
                'motif' => "Le document ne contient pas les rubriques essentielles d'un curriculum vitæ (expériences, formations, compétences, contact).",
            ];
        }

        return [
            'est_valide' => true,
            'motif' => 'Structure de CV validée.',
        ];
    }
}
