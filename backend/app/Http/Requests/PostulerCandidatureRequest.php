<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PostulerCandidatureRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'cv_id' => 'nullable|uuid|exists:cvs,id',
            'lettre_motivation' => 'nullable|string|max:10000',
            'message' => 'nullable|string|max:5000',
            'candidat_id' => 'nullable|uuid|exists:candidats,id',
            'user_id' => 'nullable|uuid|exists:users,id',
            'cv_payload' => 'nullable|array',
            'cv_payload.nom_fichier' => 'nullable|string|max:255',
            'cv_payload.type_mime' => 'nullable|string|max:100',
            'cv_payload.taille_octets' => 'nullable|integer',
            'cv_payload.contenu_base64' => 'nullable|string',
            'cv_payload.url_stockage' => 'nullable|string',
        ];
    }

    /**
     * Messages d'erreurs personnalisés.
     */
    public function messages(): array
    {
        return [
            'cv_id.exists' => 'Le CV sélectionné est introuvable.',
            'lettre_motivation.max' => 'La lettre de motivation ne doit pas dépasser 10 000 caractères.',
            'message.max' => 'Le message ne doit pas dépasser 5 000 caractères.',
        ];
    }
}
