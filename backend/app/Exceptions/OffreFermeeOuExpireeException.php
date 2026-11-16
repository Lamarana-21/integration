<?php

namespace App\Exceptions;

class OffreFermeeOuExpireeException extends CandidatureException
{
    public function __construct(string $message = "L'offre est fermée ou sa date limite est expirée.", array $payload = [])
    {
        parent::__construct($message, 422, array_merge(['error_code' => 'OFFRE_FERMEE_OU_EXPIREE'], $payload));
    }
}
