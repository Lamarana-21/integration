<?php

namespace App\Exceptions;

class CandidatureDejaExistanteException extends CandidatureException
{
    public function __construct(string $message = "Vous avez déjà postulé à cette offre d'emploi. Une seule candidature est autorisée.", array $payload = [])
    {
        parent::__construct($message, 409, array_merge(['error_code' => 'CANDIDATURE_DEJA_EXISTANTE'], $payload));
    }
}
