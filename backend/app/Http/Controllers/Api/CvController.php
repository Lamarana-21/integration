<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cv;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CvController extends Controller
{
    /**
     * Module 6.2 : Téléverser un CV (PDF ou DOCX, max 5 Mo)
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $candidat = $user->candidat;

        if (!$candidat) {
            return response()->json(['message' => 'Profil candidat introuvable'], 404);
        }

        $request->validate([
            'cv_file' => 'required|file|mimes:pdf,docx|max:5120', // 5 Mo
        ]);

        $file = $request->file('cv_file');
        $originalName = $file->getClientOriginalName();
        $mimeType = $file->getClientMimeType();
        $sizeBytes = $file->getSize();

        $fileBytes = file_get_contents($file->getRealPath());
        $base64 = base64_encode($fileBytes);

        $cv = Cv::create([
            'candidat_id' => $candidat->id,
            'nom_fichier' => $originalName,
            'type_mime' => $mimeType,
            'taille_octets' => $sizeBytes,
            'url_stockage' => 'database://cvs/' . Str::uuid(),
            'contenu_base64' => $base64,
        ]);

        return response()->json([
            'message' => 'CV téléversé avec succès',
            'cv' => $cv,
        ], 201);
    }

    /**
     * RM7 : Télécharger un CV (réservé au candidat ou au recruteur de l'entreprise concernée)
     */
    public function download(Request $request, string $id)
    {
        $cv = Cv::with('candidat.candidatures.offre')->findOrFail($id);
        $user = $request->user();

        // Vérification de sécurité RM7
        $isOwner = $user && $user->candidat && $user->candidat->id === $cv->candidat_id;
        $isAdmin = $user && $user->isAdmin();
        $isCompanyRecruiter = false;

        if ($user && $user->isRecruteur() && $user->entreprise_id) {
            foreach ($cv->candidat->candidatures as $cand) {
                if ($cand->offre && $cand->offre->entreprise_id === $user->entreprise_id) {
                    $isCompanyRecruiter = true;
                    break;
                }
            }
        }

        if ($user && !$isOwner && !$isAdmin && !$isCompanyRecruiter) {
            return response()->json(['message' => 'Accès au CV non autorisé (RM7)'], 403);
        }

        // 1. Priorité au contenu stocké directement dans la base de données
        if (!empty($cv->contenu_base64)) {
            $binary = base64_decode($cv->contenu_base64);
            return response($binary, 200, [
                'Content-Type' => $cv->type_mime ?: 'application/pdf',
                'Content-Disposition' => 'inline; filename="' . $cv->nom_fichier . '"',
                'Content-Length' => strlen($binary),
            ]);
        }

        // 2. Fallback stockage fichier physique
        if (!Storage::exists($cv->url_stockage)) {
            return response()->json(['message' => 'Fichier introuvable sur le serveur'], 404);
        }

        return Storage::download($cv->url_stockage, $cv->nom_fichier);
    }

    /**
     * Supprimer un CV
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $cv = Cv::findOrFail($id);
        $user = $request->user();

        if ($user->candidat && $user->candidat->id !== $cv->candidat_id && !$user->isAdmin()) {
            return response()->json(['message' => 'Action non autorisée'], 403);
        }

        Storage::delete($cv->url_stockage);
        $cv->delete();

        return response()->json(['message' => 'CV supprimé avec succès']);
    }
}
