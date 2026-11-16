<?php

namespace Tests\Feature;

use App\Exceptions\CandidatureDejaExistanteException;
use App\Exceptions\LimiteCandidaturesActivesException;
use App\Exceptions\OffreFermeeOuExpireeException;
use App\Models\Candidat;
use App\Models\Candidature;
use App\Models\Cv;
use App\Models\Entreprise;
use App\Models\Offre;
use App\Models\Role;
use App\Models\User;
use App\Services\CandidatureService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CandidatureWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected CandidatureService $service;
    protected User $candidatUser;
    protected User $recruteurUser;
    protected Candidat $candidat;
    protected Cv $cv;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();

        $this->service = app(CandidatureService::class);

        $roleCandidat = Role::firstOrCreate(['nom' => 'CANDIDAT'], ['description' => 'Candidat']);
        $this->candidatUser = User::create([
            'nom' => 'Bah',
            'prenom' => 'Amadou',
            'email' => 'amadou.test@example.com',
            'password' => bcrypt('password123'),
            'role_id' => $roleCandidat->id,
            'statut' => 'ACTIF',
        ]);

        $roleRecruteur = Role::firstOrCreate(['nom' => 'RECRUTEUR'], ['description' => 'Recruteur']);
        $this->recruteurUser = User::create([
            'nom' => 'Diallo',
            'prenom' => 'Fatou',
            'email' => 'fatou.recruteur@example.com',
            'password' => bcrypt('password123'),
            'role_id' => $roleRecruteur->id,
            'statut' => 'ACTIF',
        ]);

        $this->candidat = Candidat::create([
            'utilisateur_id' => $this->candidatUser->id,
            'nom' => 'Bah',
            'prenom' => 'Amadou',
            'telephone' => '+224620000000',
            'ville' => 'Conakry',
            'pays' => 'Guinée',
        ]);

        $this->cv = Cv::create([
            'candidat_id' => $this->candidat->id,
            'nom_fichier' => 'CV_Amadou_Bah.pdf',
            'type_mime' => 'application/pdf',
            'taille_octets' => 1024,
            'url_stockage' => 'database://cvs/test-cv',
            'contenu_base64' => base64_encode('%PDF-1.4 test'),
        ]);
    }

    /**
     * Test 1 : Un candidat peut postuler à PLUSIEURS entreprises différentes (OK 201)
     */
    public function test_candidat_peut_postuler_a_plusieurs_entreprises(): void
    {
        $entrepriseA = Entreprise::create([
            'nom' => 'Entreprise Alpha Tech',
            'secteur' => 'Informatique',
            'ville' => 'Paris',
            'pays' => 'France',
            'statut' => 'ACTIVE',
            'max_candidatures_actives_par_candidat' => null,
        ]);

        $entrepriseB = Entreprise::create([
            'nom' => 'Entreprise Beta Finance',
            'secteur' => 'Banque',
            'ville' => 'Lyon',
            'pays' => 'France',
            'statut' => 'ACTIVE',
            'max_candidatures_actives_par_candidat' => null,
        ]);

        $offreA = Offre::create([
            'titre' => 'Développeur Fullstack Alpha',
            'description' => 'Poste développeur Alpha',
            'type_contrat' => 'CDI',
            'statut' => 'PUBLIEE',
            'entreprise_id' => $entrepriseA->id,
            'auteur_id' => $this->recruteurUser->id,
            'date_publication' => Carbon::now(),
            'date_limite' => Carbon::now()->addDays(30),
        ]);

        $offreB = Offre::create([
            'titre' => 'Développeur Backend Beta',
            'description' => 'Poste développeur Beta',
            'type_contrat' => 'CDI',
            'statut' => 'PUBLIEE',
            'entreprise_id' => $entrepriseB->id,
            'auteur_id' => $this->recruteurUser->id,
            'date_publication' => Carbon::now(),
            'date_limite' => Carbon::now()->addDays(30),
        ]);

        // Postuler via API chez Alpha
        $responseA = $this->actingAs($this->candidatUser)
            ->postJson("/api/offres/{$offreA->id}/candidatures", [
                'candidat_id' => $this->candidat->id,
                'cv_id' => $this->cv->id,
                'lettre_motivation' => 'Très motivé par Alpha.',
            ]);

        $responseA->assertStatus(201);
        $this->assertDatabaseHas('candidatures', [
            'candidat_id' => $this->candidat->id,
            'offre_id' => $offreA->id,
        ]);

        // Postuler via API chez Beta
        $responseB = $this->actingAs($this->candidatUser)
            ->postJson("/api/offres/{$offreB->id}/candidatures", [
                'candidat_id' => $this->candidat->id,
                'cv_id' => $this->cv->id,
                'lettre_motivation' => 'Très motivé par Beta.',
            ]);

        $responseB->assertStatus(201);
        $this->assertDatabaseHas('candidatures', [
            'candidat_id' => $this->candidat->id,
            'offre_id' => $offreB->id,
        ]);

        $this->assertEquals(2, Candidature::where('candidat_id', $this->candidat->id)->count());
    }

    /**
     * Test 2 : Un candidat peut postuler à PLUSIEURS offres d'une même entreprise sans limite (OK 201)
     */
    public function test_candidat_peut_postuler_a_plusieurs_offres_dune_meme_entreprise_sans_limite(): void
    {
        $entreprise = Entreprise::create([
            'nom' => 'Entreprise Unlimited',
            'secteur' => 'Consulting',
            'statut' => 'ACTIVE',
            'max_candidatures_actives_par_candidat' => null, // Illimité
        ]);

        $offre1 = Offre::create([
            'titre' => 'Consultant Junior',
            'description' => 'Description 1',
            'type_contrat' => 'CDI',
            'statut' => 'PUBLIEE',
            'entreprise_id' => $entreprise->id,
            'auteur_id' => $this->recruteurUser->id,
            'date_publication' => Carbon::now(),
            'date_limite' => Carbon::now()->addDays(20),
        ]);

        $offre2 = Offre::create([
            'titre' => 'Consultant Senior',
            'description' => 'Description 2',
            'type_contrat' => 'CDI',
            'statut' => 'PUBLIEE',
            'entreprise_id' => $entreprise->id,
            'auteur_id' => $this->recruteurUser->id,
            'date_publication' => Carbon::now(),
            'date_limite' => Carbon::now()->addDays(20),
        ]);

        // Candidature 1
        $res1 = $this->actingAs($this->candidatUser)
            ->postJson("/api/offres/{$offre1->id}/candidatures", [
                'candidat_id' => $this->candidat->id,
                'cv_id' => $this->cv->id,
            ]);
        $res1->assertStatus(201);

        // Candidature 2
        $res2 = $this->actingAs($this->candidatUser)
            ->postJson("/api/offres/{$offre2->id}/candidatures", [
                'candidat_id' => $this->candidat->id,
                'cv_id' => $this->cv->id,
            ]);
        $res2->assertStatus(201);

        $this->assertEquals(2, Candidature::where('candidat_id', $this->candidat->id)->count());
    }

    /**
     * Test 3 : Un candidat ne peut postuler QU'UNE SEULE FOIS à la même offre (refusé 409)
     */
    public function test_postuler_deux_fois_a_la_meme_offre_est_refuse_avec_409(): void
    {
        $entreprise = Entreprise::create([
            'nom' => 'Tech Corp',
            'statut' => 'ACTIVE',
        ]);

        $offre = Offre::create([
            'titre' => 'Lead Developer',
            'description' => 'Lead dev tech',
            'type_contrat' => 'CDI',
            'statut' => 'PUBLIEE',
            'entreprise_id' => $entreprise->id,
            'auteur_id' => $this->recruteurUser->id,
            'date_publication' => Carbon::now(),
            'date_limite' => Carbon::now()->addDays(15),
        ]);

        // Première candidature -> OK 201
        $res1 = $this->actingAs($this->candidatUser)
            ->postJson("/api/offres/{$offre->id}/candidatures", [
                'candidat_id' => $this->candidat->id,
                'cv_id' => $this->cv->id,
            ]);
        $res1->assertStatus(201);

        // Deuxième candidature à la même offre -> Refusé 409 Conflict
        $res2 = $this->actingAs($this->candidatUser)
            ->postJson("/api/offres/{$offre->id}/candidatures", [
                'candidat_id' => $this->candidat->id,
                'cv_id' => $this->cv->id,
            ]);

        $res2->assertStatus(409);
        $res2->assertJsonFragment(['error_code' => 'CANDIDATURE_DEJA_EXISTANTE']);
        $this->assertStringContainsString('déjà postulé', $res2->json('message'));

        // Vérification directe du service : lance l'exception dédiée
        $this->expectException(CandidatureDejaExistanteException::class);
        $this->service->postuler($this->candidat, $offre, ['cv_id' => $this->cv->id]);
    }

    /**
     * Test 4 : Dépassement de la limite configurée par l'entreprise (refusé 422)
     */
    public function test_depassement_de_la_limite_active_configuree_est_refuse_avec_422(): void
    {
        $entreprise = Entreprise::create([
            'nom' => 'Strict Enterprise',
            'statut' => 'ACTIVE',
            'max_candidatures_actives_par_candidat' => 1, // Max 1 seule candidature active simultanée
        ]);

        $offre1 = Offre::create([
            'titre' => 'Poste A',
            'type_contrat' => 'CDI',
            'statut' => 'PUBLIEE',
            'entreprise_id' => $entreprise->id,
            'auteur_id' => $this->recruteurUser->id,
            'date_publication' => Carbon::now(),
            'date_limite' => Carbon::now()->addDays(10),
        ]);

        $offre2 = Offre::create([
            'titre' => 'Poste B',
            'type_contrat' => 'CDI',
            'statut' => 'PUBLIEE',
            'entreprise_id' => $entreprise->id,
            'auteur_id' => $this->recruteurUser->id,
            'date_publication' => Carbon::now(),
            'date_limite' => Carbon::now()->addDays(10),
        ]);

        // Première candidature -> OK 201 (statut RECUE = actif)
        $res1 = $this->actingAs($this->candidatUser)
            ->postJson("/api/offres/{$offre1->id}/candidatures", [
                'candidat_id' => $this->candidat->id,
                'cv_id' => $this->cv->id,
            ]);
        $res1->assertStatus(201);

        // Deuxième candidature dans la même entreprise avec limite = 1 -> Refusé 422
        $res2 = $this->actingAs($this->candidatUser)
            ->postJson("/api/offres/{$offre2->id}/candidatures", [
                'candidat_id' => $this->candidat->id,
                'cv_id' => $this->cv->id,
            ]);

        $res2->assertStatus(422);
        $res2->assertJsonFragment(['error_code' => 'LIMITE_CANDIDATURES_ACTIVES_ATTEINTE']);
        $this->assertStringContainsString('limite à 1 candidature(s) active(s)', $res2->json('message'));
    }

    /**
     * Test 5 : Nouvelle candidature après un refus ou un retrait (OK 201)
     */
    public function test_nouvelle_candidature_apres_un_refus_est_autorisee(): void
    {
        $entreprise = Entreprise::create([
            'nom' => 'OneActiveJob Enterprise',
            'statut' => 'ACTIVE',
            'max_candidatures_actives_par_candidat' => 1, // Limite = 1 active
        ]);

        $offre1 = Offre::create([
            'titre' => 'Poste Initial',
            'type_contrat' => 'CDI',
            'statut' => 'PUBLIEE',
            'entreprise_id' => $entreprise->id,
            'auteur_id' => $this->recruteurUser->id,
            'date_publication' => Carbon::now(),
            'date_limite' => Carbon::now()->addDays(10),
        ]);

        $offre2 = Offre::create([
            'titre' => 'Autre Poste Plus Adapté',
            'type_contrat' => 'CDI',
            'statut' => 'PUBLIEE',
            'entreprise_id' => $entreprise->id,
            'auteur_id' => $this->recruteurUser->id,
            'date_publication' => Carbon::now(),
            'date_limite' => Carbon::now()->addDays(10),
        ]);

        // 1. Postuler à Offre 1
        $candidature1 = $this->service->postuler($this->candidat, $offre1, ['cv_id' => $this->cv->id]);
        $this->assertEquals('RECUE', $candidature1->statut);

        // 2. Le recruteur refuse la candidature 1
        $candidature1->update(['statut' => 'REFUSEE']);

        // 3. Le candidat postule maintenant à Offre 2 de la même entreprise -> Doit réussir car statut REFUSEE n'est plus actif !
        $response = $this->actingAs($this->candidatUser)
            ->postJson("/api/offres/{$offre2->id}/candidatures", [
                'candidat_id' => $this->candidat->id,
                'cv_id' => $this->cv->id,
                'lettre_motivation' => 'Nouveau profil après refus.',
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('candidatures', [
            'candidat_id' => $this->candidat->id,
            'offre_id' => $offre2->id,
            'statut' => 'RECUE',
        ]);
    }

    /**
     * Test 6 : Impossible de postuler à une offre expirée ou non publiée (refusé 422)
     */
    public function test_impossible_de_postuler_a_une_offre_fermee_ou_expiree(): void
    {
        $entreprise = Entreprise::create(['nom' => 'Entreprise Test', 'statut' => 'ACTIVE']);

        // Offre fermée (statut BROUILLON / CLOTUREE)
        $offreFermee = Offre::create([
            'titre' => 'Offre Clôturée',
            'statut' => 'CLOTUREE',
            'entreprise_id' => $entreprise->id,
            'auteur_id' => $this->recruteurUser->id,
            'date_publication' => Carbon::now()->subDays(10),
        ]);

        $resFermee = $this->actingAs($this->candidatUser)
            ->postJson("/api/offres/{$offreFermee->id}/candidatures", [
                'candidat_id' => $this->candidat->id,
                'cv_id' => $this->cv->id,
            ]);

        $resFermee->assertStatus(422);
        $resFermee->assertJsonFragment(['error_code' => 'OFFRE_FERMEE_OU_EXPIREE']);

        // Offre dont la date_limite est expirée (dans le passé)
        $offreExpiree = Offre::create([
            'titre' => 'Offre Expirée',
            'statut' => 'PUBLIEE',
            'entreprise_id' => $entreprise->id,
            'auteur_id' => $this->recruteurUser->id,
            'date_publication' => Carbon::now()->subDays(20),
            'date_limite' => Carbon::now()->subDay(), // hier
        ]);

        $resExpiree = $this->actingAs($this->candidatUser)
            ->postJson("/api/offres/{$offreExpiree->id}/candidatures", [
                'candidat_id' => $this->candidat->id,
                'cv_id' => $this->cv->id,
            ]);

        $resExpiree->assertStatus(422);
        $resExpiree->assertJsonFragment(['error_code' => 'OFFRE_FERMEE_OU_EXPIREE']);
    }
}
