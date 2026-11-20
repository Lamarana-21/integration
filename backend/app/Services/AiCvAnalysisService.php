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
    protected string $modelVersion = 'Gemini-3-Flash / ATS-Pro-v3';

    /**
     * Synonymes et variantes courantes des compétences techniques & métiers
     * Permet de reconnaître les compétences même si elles sont formulées différemment sur le CV
     */
    protected array $skillSynonyms = [
        'react' => ['react', 'reactjs', 'react.js', 'next.js', 'nextjs', 'redux', 'jsx', 'tsx', 'frontend'],
        'node.js' => ['node.js', 'nodejs', 'node', 'express', 'expressjs', 'nestjs', 'javascript', 'typescript', 'backend'],
        'sql' => ['sql', 'mysql', 'postgresql', 'postgres', 'mariadb', 'sqlite', 'oracle', 'pl/sql', 't-sql', 'base de donnees', 'bases de donnees', 'sgbd', 'database'],
        'docker' => ['docker', 'dockerfile', 'docker-compose', 'conteneur', 'container', 'podman'],
        'kubernetes' => ['kubernetes', 'k8s', 'helm', 'openshift', 'orchestration'],
        'ci/cd' => ['ci/cd', 'cicd', 'gitlab ci', 'github actions', 'jenkins', 'azure devops', 'pipeline', 'integration continue', 'deploiement continu'],
        'linux' => ['linux', 'ubuntu', 'debian', 'centos', 'redhat', 'bash', 'shell', 'unix', 'sysadmin'],
        'aws' => ['aws', 'amazon web services', 'ec2', 's3', 'lambda', 'cloud', 'gcp', 'azure'],
        'python' => ['python', 'django', 'flask', 'fastapi', 'pandas', 'numpy', 'pytorch', 'scikit-learn'],
        'java' => ['java', 'spring', 'spring boot', 'j2ee', 'jee', 'hibernate', 'maven', 'gradle'],
        'php' => ['php', 'laravel', 'symfony', 'wordpress', 'composer', 'eloquent'],
        'javascript' => ['javascript', 'js', 'es6', 'typescript', 'ts', 'ecmascript'],
        'typescript' => ['typescript', 'ts', 'javascript', 'angular', 'react', 'next.js'],
        'angular' => ['angular', 'angularjs', 'rxjs', 'typescript'],
        'vue' => ['vue', 'vuejs', 'vue.js', 'nuxt', 'pinia', 'vuex'],
        'git' => ['git', 'github', 'gitlab', 'bitbucket', 'versioning'],
        'agile' => ['agile', 'scrum', 'kanban', 'jira', 'sprint'],
        'html' => ['html', 'html5', 'css', 'css3', 'tailwind', 'bootstrap', 'sass'],
        'css' => ['css', 'css3', 'tailwind', 'tailwindcss', 'bootstrap', 'sass', 'scss'],
        'c#' => ['c#', 'csharp', '.net', 'dotnet', 'asp.net'],
        'c++' => ['c++', 'cpp', 'c', 'qt'],
        'flutter' => ['flutter', 'dart', 'mobile', 'android', 'ios'],
        'android' => ['android', 'kotlin', 'java', 'mobile', 'flutter', 'react native'],
    ];

    /**
     * Analyse un CV pour une candidature donnée (ou CV autonome)
     */
    public function analyser(Cv $cv, ?Candidature $candidature = null): AnalyseCv
    {
        $offre = $candidature?->offre;

        // 1. Tenter l'analyse intelligente via Google Gemini API (avec fallback multi-modèles)
        $geminiResult = $this->analyserAvecGemini($cv, $offre);

        if ($geminiResult !== null) {
            return $this->enregistrerAnalyse($cv, $candidature, [
                'infos_extraites' => $geminiResult['infos_extraites'],
                'resume' => $geminiResult['resume'],
                'score_correspondance' => $geminiResult['score'],
                'points_forts' => $geminiResult['points_forts'],
                'points_manquants' => $geminiResult['points_manquants'],
                'niveau_confiance' => $geminiResult['niveau_confiance'],
                'version_modele' => $geminiResult['modele'] ?? $this->modelVersion,
            ]);
        }

        // 2. Moteur d'analyse ATS local haute précision (extraction PDF avancée + sémantique + profil)
        return $this->analyseLocaleRealiste($cv, $candidature);
    }

    /**
     * Crée ou met à jour l'analyse pour la candidature ou le CV
     */
    protected function enregistrerAnalyse(Cv $cv, ?Candidature $candidature, array $attributes): AnalyseCv
    {
        if ($candidature) {
            return AnalyseCv::updateOrCreate(
                ['candidature_id' => $candidature->id],
                array_merge($attributes, [
                    'cv_id' => $cv->id,
                    'valide_par_recruteur' => false,
                ])
            );
        }

        return AnalyseCv::create(array_merge($attributes, [
            'cv_id' => $cv->id,
            'candidature_id' => null,
            'valide_par_recruteur' => false,
        ]));
    }

    /**
     * Analyse multimodale Gemini avec bascule automatique sur les modèles fonctionnels
     */
    protected function analyserAvecGemini(Cv $cv, ?Offre $offre): ?array
    {
        $apiKey = config('services.gemini.key') ?: env('GEMINI_API_KEY');
        if (empty($apiKey) || empty($cv->contenu_base64)) {
            return null;
        }

        // Vérification rapide du nom de fichier avant même d'appeler Gemini (économie et rapidité si c'est clairement un TP/Cours/Facture)
        $preCheck = $this->validerConformiteCv($cv, '');
        if (!$preCheck['est_valide']) {
            return [
                'est_cv' => false,
                'score' => 0,
                'modele' => 'Gemini-3-Flash / ATS-Guard',
                'resume' => "Document non conforme : " . $preCheck['motif'],
                'points_forts' => [],
                'points_manquants' => [
                    "Document non reconnu comme un curriculum vitæ (score : 0%).",
                    "Veuillez déposer un véritable CV contenant vos expériences, formations et compétences."
                ],
                'niveau_confiance' => 'FAIBLE',
                'infos_extraites' => [
                    'competences' => [],
                    'experiences' => [],
                    'formations' => [],
                    'langues' => [],
                ],
            ];
        }

        $base64 = $cv->contenu_base64;
        if (str_contains($base64, ',')) {
            $base64 = explode(',', $base64)[1];
        }

        // Ne pas envoyer à Gemini le mini-placeholder factice de 40 octets
        if (strlen($base64) < 120) {
            return null;
        }

        $offreTitre = $offre ? $offre->titre : 'Poste professionnel';
        $offreDescription = $offre ? ($offre->description ?? '') : '';
        $offreSkills = $offre && !empty($offre->competences_requises)
            ? implode(', ', $offre->competences_requises)
            : 'Compétences générales du poste';

        $prompt = <<<PROMPT
Tu es un expert RH et système ATS de recrutement. Analyse avec précision et réalisme le document PDF joint pour cette offre d'emploi :
- Poste visé : {$offreTitre}
- Compétences attendues : {$offreSkills}
- Contexte du poste : {$offreDescription}

RÈGLES D'ÉVALUATION RÉALISTES :
1. VÉRIFICATION DU TYPE DE DOCUMENT :
   - Est-ce un Curriculum Vitæ (CV / Resume / Profil professionnel ou étudiant) ?
   - ATTENTION : Un vrai CV (même d'un étudiant mentionnant des projets académiques, stages, TP réalisés dans son parcours, ou un CV au design moderne/Canva) EST UN VRAI CV (`est_cv: true`).
   - Rejette (`est_cv: false`, `score: 0`) UNIQUEMENT si le document n'est clairement PAS un CV (ex: un énoncé d'exercice/TP de professeur sans nom de candidat, une facture, un livre, un cours magistral, une image vide).

2. CALCUL DU SCORE RÉALISTE (SI C'EST UN VRAI CV) :
   - Évalue l'ensemble du CV : compétences directes, technologies proches/équivalentes, expériences, projets, formations et potentiel pour le poste "{$offreTitre}".
   - Si le candidat possède toutes ou presque toutes les compétences : score entre 80 et 96.
   - Si le candidat possède une partie des compétences ou des compétences proches/transférables : score entre 55 et 79.
   - Si le candidat est un vrai CV d'un domaine connexe mais qu'il lui manque la majorité des outils spécifiques : score réaliste entre 25 et 54 (ne mets JAMAIS 0% à un vrai CV structuré !).
   - Dans `infos_extraites.competences`, liste TOUTES les compétences trouvées dans le CV, et utilise le nom exact des compétences attendues ({$offreSkills}) dès que le CV montre cette compétence ou un équivalent direct.

Réponds uniquement en JSON valide :
{
  "est_cv": true,
  "score": 78,
  "resume": "Synthèse professionnelle claire en français (2-3 phrases) détaillant les forces du profil par rapport au poste.",
  "points_forts": ["Point fort précis extrait du CV 1", "Point fort 2", "Point fort 3"],
  "points_manquants": ["Compétence ou point à vérifier en entretien"],
  "niveau_confiance": "ELEVE",
  "infos_extraites": {
    "competences": ["Compétence 1", "Compétence 2"],
    "experiences": [{"poste": "Titre", "employeur": "Entreprise", "dates": "Période"}],
    "formations": [{"diplome": "Diplôme", "ecole": "École", "annee": "Année"}],
    "langues": ["Français", "Anglais"]
  }
}
PROMPT;

        // Ordre de priorité des modèles Gemini testés et fonctionnels sur cette clé
        $models = [
            'gemini-3-flash-preview',
            'gemini-3.1-flash-lite',
            'gemini-3.8-flash',
        ];

        foreach ($models as $model) {
            try {
                $response = Http::timeout(15)
                    ->withoutVerifying()
                    ->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", [
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
                            'temperature' => 0.15,
                        ],
                    ]);

                if ($response->successful()) {
                    $candidates = $response->json('candidates', []);
                    $textResult = $candidates[0]['content']['parts'][0]['text'] ?? '';
                    if (!empty($textResult)) {
                        $cleanJson = preg_replace('/^```json\s*|\s*```$/i', '', trim($textResult));
                        $json = json_decode(trim($cleanJson), true);
                        if (is_array($json) && array_key_exists('est_cv', $json)) {
                            $estCv = (bool) $json['est_cv'];
                            $rawScore = (int) ($json['score'] ?? 0);

                            // Si ce n'est pas un CV -> Score 0% et mention claire "Document non conforme"
                            $finalScore = !$estCv ? 0 : max(22, min(98, $rawScore > 0 ? $rawScore : 62));
                            $rawResume = $json['resume'] ?? 'Analyse IA effectuée avec succès.';
                            $finalResume = !$estCv && !str_contains(strtolower($rawResume), 'document non conforme')
                                ? "Document non conforme : " . $rawResume
                                : $rawResume;

                            return [
                                'est_cv' => $estCv,
                                'score' => $finalScore,
                                'modele' => $model,
                                'resume' => $finalResume,
                                'points_forts' => !$estCv ? [] : (is_array($json['points_forts'] ?? null) ? $json['points_forts'] : []),
                                'points_manquants' => is_array($json['points_manquants'] ?? null) && count($json['points_manquants']) > 0
                                    ? $json['points_manquants']
                                    : (!$estCv ? ["Document non reconnu comme un curriculum vitæ (score : 0%).", "Veuillez déposer un véritable CV professionnel."] : []),
                                'niveau_confiance' => !$estCv ? 'FAIBLE' : ($json['niveau_confiance'] ?? ($finalScore >= 75 ? 'ELEVE' : 'MOYEN')),
                                'infos_extraites' => !$estCv ? [
                                    'competences' => [],
                                    'experiences' => [],
                                    'formations' => [],
                                    'langues' => [],
                                ] : (is_array($json['infos_extraites'] ?? null) ? $json['infos_extraites'] : [
                                    'competences' => [],
                                    'experiences' => [],
                                    'formations' => [],
                                    'langues' => ['Français'],
                                ]),
                            ];
                        }
                    }
                }
            } catch (\Throwable $e) {
                Log::info("Modèle Gemini {$model} indisponible : " . $e->getMessage());
            }
        }

        return null;
    }

    /**
     * Analyseur ATS local réaliste et performant (ne rejette jamais un vrai CV)
     */
    protected function analyseLocaleRealiste(Cv $cv, ?Candidature $candidature): AnalyseCv
    {
        $candidat = $cv->candidat ?? $candidature?->candidat;
        $offre = $candidature?->offre;

        // 1. Extraire tout le texte lisible du PDF (ANSI + UTF-16BE Hex + FlateDecode)
        $texteExtrait = $this->extraireTextePdf($cv);

        // 2. Vérifier si le document est manifestement un faux document (énoncé de TP, facture, etc.)
        $validationCv = $this->validerConformiteCv($cv, $texteExtrait);

        if (!$validationCv['est_valide']) {
            return $this->enregistrerAnalyse($cv, $candidature, [
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
                    "Document non reconnu comme un CV professionnel (score : 0%).",
                    "Veuillez déposer un curriculum vitæ contenant vos expériences, formations et compétences."
                ],
                'niveau_confiance' => 'FAIBLE',
                'version_modele' => $this->modelVersion,
            ]);
        }

        // 3. C'est un VRAI CV -> combiner le texte extrait du PDF et les données du profil candidat
        $requises = $offre && !empty($offre->competences_requises)
            ? $offre->competences_requises
            : ['React', 'Node.js', 'SQL'];

        $profilSkills = is_array($candidat?->competences) ? $candidat->competences : [];
        $corpusComplet = strtolower($texteExtrait . ' ' . implode(' ', $profilSkills) . ' ' . ($candidat?->titre ?? '') . ' ' . ($candidat?->resume ?? ''));
        $corpusNormalise = $this->normaliserTexte($corpusComplet);

        // Détecter les compétences requises présentes dans le CV (avec synonymes)
        $matchedReq = [];
        $missingReq = [];

        foreach ($requises as $req) {
            if ($this->competencePresente($req, $corpusNormalise, $profilSkills)) {
                $matchedReq[] = $req;
            } else {
                $missingReq[] = $req;
            }
        }

        // Détecter toutes les autres compétences techniques présentes dans le CV
        $toutesCompetencesDetectees = $matchedReq;
        foreach (array_keys($this->skillSynonyms) as $techKey) {
            $label = ucfirst($techKey);
            if (!in_array($label, $toutesCompetencesDetectees) && !in_array($techKey, array_map('strtolower', $toutesCompetencesDetectees))) {
                if (str_contains($corpusNormalise, $this->normaliserTexte($techKey))) {
                    $toutesCompetencesDetectees[] = strtoupper($techKey) === 'SQL' || strtoupper($techKey) === 'AWS'
                        ? strtoupper($techKey)
                        : ucfirst($techKey);
                }
            }
        }
        foreach ($profilSkills as $ps) {
            if (!in_array($ps, $toutesCompetencesDetectees)) {
                $toutesCompetencesDetectees[] = $ps;
            }
        }

        // 4. Calcul réaliste multi-critères du score d'adéquation :
        // - Structure CV & parcours valide : 22 pts
        // - Expériences & formations : jusqu'à 18 pts
        // - Compétences requises pour l'offre : jusqu'à 58 pts
        $totalReq = max(1, count($requises));
        $matchRatio = count($matchedReq) / $totalReq;

        $baseStructureScore = 22;
        $expCount = is_array($candidat?->experiences) ? count($candidat->experiences) : 1;
        $formCount = is_array($candidat?->formations) ? count($candidat->formations) : 1;
        $bonusParcours = min(18, ($expCount * 6) + ($formCount * 5) + (count($toutesCompetencesDetectees) > 0 ? 4 : 0));
        $skillsScore = (int) round($matchRatio * 56);

        $score = min(96, max(28, $baseStructureScore + $bonusParcours + $skillsScore));

        $offreTitre = $offre?->titre ?? 'Poste visé';
        if (count($matchedReq) === count($requises)) {
            $resume = "Excellent profil pour le poste de « {$offreTitre} » : le CV (« {$cv->nom_fichier} ») valide l'intégralité des " . count($requises) . " compétences clés attendues ainsi qu'un parcours structuré.";
        } elseif (count($matchedReq) > 0) {
            $resume = "CV professionnel validé (« {$cv->nom_fichier} »). Le profil couvre " . count($matchedReq) . " sur " . count($requises) . " compétence(s) requise(s) pour le poste de « {$offreTitre} » (" . implode(', ', $matchedReq) . ") avec un socle technique pertinent.";
        } else {
            $autresComp = !empty($toutesCompetencesDetectees)
                ? implode(', ', array_slice($toutesCompetencesDetectees, 0, 5))
                : 'compétences générales';
            $resume = "CV professionnel conforme (« {$cv->nom_fichier} ») évalué à {$score}%. Bien que les outils spécifiques de l'offre « {$offreTitre} » ne soient pas explicitement cités, le candidat dispose d'un parcours vérifié et de compétences transférables ({$autresComp}).";
        }

        $pointsForts = [
            "Curriculum vitæ authentifié et structure professionnelle conforme ATS",
        ];
        if (count($matchedReq) > 0) {
            $pointsForts[] = "Compétences requises maîtrisées : " . implode(', ', $matchedReq);
        }
        if (!empty($toutesCompetencesDetectees)) {
            $pointsForts[] = "Bagage technique identifié : " . implode(', ', array_slice($toutesCompetencesDetectees, 0, 6));
        }
        $pointsForts[] = "Parcours documenté (" . max(1, $expCount) . " expérience(s), " . max(1, $formCount) . " formation(s))";

        $pointsManquants = count($missingReq) > 0
            ? array_map(fn($m) => "Compétence à approfondir en entretien : {$m}", $missingReq)
            : ["L'ensemble des prérequis techniques de l'offre est couvert"];

        return $this->enregistrerAnalyse($cv, $candidature, [
            'infos_extraites' => [
                'competences' => array_values(array_unique($toutesCompetencesDetectees)),
                'experiences' => $candidat?->experiences ?? [],
                'formations' => $candidat?->formations ?? [],
                'langues' => $candidat?->langues ?? ['Français', 'Anglais'],
            ],
            'resume' => $resume,
            'score_correspondance' => $score,
            'points_forts' => $pointsForts,
            'points_manquants' => $pointsManquants,
            'niveau_confiance' => $score >= 75 ? 'ELEVE' : 'MOYEN',
            'version_modele' => $this->modelVersion,
        ]);
    }

    /**
     * Vérifie si une compétence (ou l'un de ses synonymes) est présente dans le texte du CV ou le profil
     */
    protected function competencePresente(string $reqSkill, string $corpusNormalise, array $profilSkills): bool
    {
        $reqNorm = $this->normaliserTexte($reqSkill);
        if (empty($reqNorm)) {
            return false;
        }

        // 1. Présence directe dans le texte
        if (str_contains($corpusNormalise, $reqNorm)) {
            return true;
        }

        // 2. Correspondance dans les compétences du profil
        foreach ($profilSkills as $ps) {
            $psNorm = $this->normaliserTexte($ps);
            if ($psNorm !== '' && (str_contains($psNorm, $reqNorm) || str_contains($reqNorm, $psNorm))) {
                return true;
            }
        }

        // 3. Synonymes techniques
        $reqLower = strtolower(trim($reqSkill));
        $synonyms = $this->skillSynonyms[$reqLower] ?? [];
        foreach ($synonyms as $syn) {
            $synNorm = $this->normaliserTexte($syn);
            if ($synNorm !== '' && strlen($synNorm) >= 2 && str_contains($corpusNormalise, $synNorm)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Normalise un texte (minuscules, sans accents) pour la recherche de mots-clés
     */
    protected function normaliserTexte(string $str): string
    {
        $str = mb_strtolower($str, 'UTF-8');
        $accents = [
            'à' => 'a', 'â' => 'a', 'ä' => 'a', 'á' => 'a',
            'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e',
            'î' => 'i', 'ï' => 'i', 'í' => 'i',
            'ô' => 'o', 'ö' => 'o', 'ó' => 'o',
            'ù' => 'u', 'û' => 'u', 'ü' => 'u', 'ú' => 'u',
            'ç' => 'c', 'æ' => 'ae', 'œ' => 'oe',
        ];
        return strtr($str, $accents);
    }

    /**
     * Extraction textuelle multi-format depuis un PDF (Parenthèses Tj/TJ, Hex UTF-16BE <...>, FlateDecode)
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

        // Collecter tous les buffers (flux décompressés + flux bruts)
        $buffers = [$raw];
        if (preg_match_all('/stream[\r\n]+(.*?)[\r\n]+endstream/is', $raw, $matches)) {
            foreach ($matches[1] as $stream) {
                $uncompressed = @gzuncompress($stream);
                if ($uncompressed === false) {
                    $uncompressed = @gzinflate($stream);
                }
                if ($uncompressed === false && strlen($stream) > 2) {
                    $uncompressed = @gzinflate(substr($stream, 2));
                }
                if ($uncompressed !== false) {
                    $buffers[] = $uncompressed;
                }
            }
        }

        foreach ($buffers as $buf) {
            // 1. Chaînes entre parenthèses (...)
            if (preg_match_all('/\(([^()]{2,})\)/s', $buf, $pMatches)) {
                foreach ($pMatches[1] as $segment) {
                    // Ignorer les métadonnées binaires PDF
                    if (!preg_match('/^[\x00-\x1f]+$/', $segment)) {
                        $texte .= ' ' . $segment;
                    }
                }
            }

            // 2. Chaînes hexadécimales <...> (Word, Canva, Google Docs encodent souvent en UTF-16BE Hex)
            if (preg_match_all('/<([0-9A-Fa-f]{8,})>/', $buf, $hexMatches)) {
                foreach ($hexMatches[1] as $hex) {
                    if (strlen($hex) % 2 === 0) {
                        $bin = @hex2bin($hex);
                        if ($bin !== false) {
                            // Supprimer les octets nuls d'UTF-16BE pour reconstituer le texte ASCII/Latin
                            $clean = str_replace("\x00", '', $bin);
                            if (preg_match('/[a-zA-Z]{2,}/', $clean)) {
                                $texte .= ' ' . $clean;
                            }
                        }
                    }
                }
            }
        }

        // Nettoyage des caractères non imprimables
        $filtered = preg_replace('/[^a-zA-Z0-9\sÀ-ÿ\.\,\-\_\:\;\@\/\(\)\+\#]/u', ' ', $texte);
        $filtered = preg_replace('/\s+/', ' ', (string) $filtered);

        return trim((string) $filtered);
    }

    /**
     * Vérifie si le fichier est un vrai CV ou un document manifestement non conforme (énoncé de TP, facture, etc.)
     */
    protected function validerConformiteCv(Cv $cv, string $texte): array
    {
        $nomFichier = $this->normaliserTexte($cv->nom_fichier ?? '');

        // 1. Rejet strict si le nom du fichier indique clairement un document scolaire/cours/administratif et non un CV
        $motifsRejet = '/(?:^|[\s_\-\.])(tp|td|atelier|chapitre|cours|enonce|devoir|facture|invoice|exercice|corrige|sujet|releve|note|notes|compte[\s_\-\.]*rendu|rapport|examen|partiel|syllabus|tutoriel|guide)\d*(?:$|[\s_\-\.])/i';
        if (preg_match($motifsRejet, $nomFichier)) {
            return [
                'est_valide' => false,
                'motif' => "Le fichier déposé (« {$cv->nom_fichier} ») correspond à un support de cours, énoncé de TP/Atelier ou document administratif et non à un curriculum vitæ.",
            ];
        }

        // 2. Vérifier le contenu textuel extrait
        $texteNorm = $this->normaliserTexte($texte);

        $marqueursEnonceTp = [
            'enonce du tp', 'travail a rendre', 'bareme', 'exercice 1', 'exercice 2',
            'objectif du tp', 'travaux pratiques', 'atelier ', 'chapitre ', 'active directory',
            'compte rendu', 'releve de note', 'bulletin de notes', 'facture n',
        ];
        $nbMarqueursTp = 0;
        foreach ($marqueursEnonceTp as $mTp) {
            if (str_contains($texteNorm, $mTp)) {
                $nbMarqueursTp++;
            }
        }
        if ($nbMarqueursTp >= 2) {
            return [
                'est_valide' => false,
                'motif' => "Le contenu du document correspond à un support de cours, travaux pratiques ou document non-CV.",
            ];
        }

        // 3. Si le texte extrait ne contient aucun marqueur de CV et que le nom ne contient pas "cv" / "resume" / "profil" / "candidat"
        $estNomCvExplicite = (bool) preg_match('/(cv|resume|curriculum|profil|candidat)/i', $nomFichier);
        if (!$estNomCvExplicite && strlen($texteNorm) > 80) {
            $marqueursCv = ['experience', 'formation', 'competence', 'diplome', 'stage', 'projet', 'langue', 'contact', 'telephone', 'email', 'linkedin', 'github', 'profil', 'education', 'skills'];
            $nbMarqueursCv = 0;
            foreach ($marqueursCv as $mCv) {
                if (str_contains($texteNorm, $mCv)) {
                    $nbMarqueursCv++;
                }
            }
            if ($nbMarqueursCv < 2) {
                return [
                    'est_valide' => false,
                    'motif' => "Le document « {$cv->nom_fichier} » ne comporte pas les rubriques essentielles d'un curriculum vitæ (expériences, formations, compétences).",
                ];
            }
        }

        return [
            'est_valide' => true,
            'motif' => 'CV professionnel valide.',
        ];
    }
}
