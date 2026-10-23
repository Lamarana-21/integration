<?php

namespace Tests\Feature;

use App\Models\Candidat;
use App\Models\Candidature;
use App\Models\Cv;
use App\Models\Entreprise;
use App\Models\Offre;
use App\Models\Role;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RecruitmentApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    /**
     * Test RM1 : Offres visibles publiquement si statut PUBLIEE et date_limite non dépassée
     */
    public function test_rm1_public_jobs_only_returns_published_and_active_offers(): void
    {
        $response = $this->getJson('/api/jobs');

        $response->assertStatus(200);
        $data = $response->json('data');

        $this->assertNotEmpty($data);
        foreach ($data as $offre) {
            $this->assertEquals('PUBLIEE', $offre['statut']);
            if (!empty($offre['date_limite'])) {
                $this->assertTrue(Carbon::parse($offre['date_limite'])->isFuture() || Carbon::parse($offre['date_limite'])->isToday());
            }
        }
    }

    /**
     * Test RM10 : Un compte INACTIF ne peut pas se connecter
     */
    public function test_rm10_inactive_user_cannot_login(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'karim@mail.example', // Inactif dans le seeder
            'password' => 'password123',
        ]);

        $response->assertStatus(403);
        $this->assertStringContainsString('suspendu ou inactif', $response->json('message'));
    }

    /**
     * Test RM2 : Empêcher une double candidature à la même offre
     */
    public function test_rm2_prevent_duplicate_application(): void
    {
        $candidatUser = User::where('email', 'amina@mail.example')->first();
        $offre = Offre::where('titre', 'Développeur Web Junior')->first();
        $cv = Cv::where('candidat_id', $candidatUser->candidat->id)->first();

        // Amina a déjà postulé dans le seeder
        $response = $this->actingAs($candidatUser, 'sanctum')->postJson("/api/jobs/{$offre->id}/applications", [
            'cv_id' => $cv->id,
            'lettre_motivation' => 'Nouvelle tentative',
        ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('déjà postulé', $response->json('message'));
    }

    /**
     * Test RM4 & Module 8.3 : Mise à jour du statut par le recruteur et notification
     */
    public function test_rm4_recruiter_updates_application_status(): void
    {
        $recruteur = User::where('email', 'rh@alpha.example')->first();
        $candidature = Candidature::first();

        $response = $this->actingAs($recruteur, 'sanctum')->patchJson("/api/applications/{$candidature->id}/status", [
            'statut' => 'ENTRETIEN',
            'commentaire_recruteur' => 'Entretien programmé vendredi 14h',
        ]);

        $response->assertStatus(200);
        $this->assertEquals('ENTRETIEN', $response->json('candidature.statut'));

        // Vérification de la création d'une notification
        $this->assertDatabaseHas('notifications', [
            'utilisateur_id' => $candidature->candidat->utilisateur_id,
            'type' => 'CHANGEMENT_STATUT',
        ]);
    }

    /**
     * Test RM5 : Retirer une candidature non traitée
     */
    public function test_rm5_candidate_can_withdraw_application(): void
    {
        $candidatUser = User::where('email', 'amina@mail.example')->first();
        $candidature = Candidature::where('candidat_id', $candidatUser->candidat->id)->first();

        $response = $this->actingAs($candidatUser, 'sanctum')->deleteJson("/api/applications/{$candidature->id}");

        $response->assertStatus(200);
        $this->assertEquals('RETIREE', $candidature->fresh()->statut);
    }
}
