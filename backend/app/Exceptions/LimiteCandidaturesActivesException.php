<?php

namespace App\Exceptions;

class LimiteCandidaturesActivesException extends CandidatureException
{
    public function __construct(
        string $message = "Limite de candidatures actives atteinte pour cette entreprise.",
        int $limite = 0,
        int $actives = 0,
        array $payload = []
    ) {
        parent::__construct(
            $message,
            422,
            array_merge([
                'error_code' => 'LIMITE_CANDIDATURES_ACTIVES_ATTEINTE',
                'limite_autorisee' => $limite,
                'candidatures_actives' => $actives,
            ], $payload)
        );
    }
}
