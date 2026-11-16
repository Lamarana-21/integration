<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class CandidatureException extends Exception
{
    protected int $statusCode = 422;
    protected array $payload = [];

    public function __construct(string $message = "", int $statusCode = 422, array $payload = [], ?\Throwable $previous = null)
    {
        $this->statusCode = $statusCode;
        $this->payload = $payload;
        parent::__construct($message, $statusCode, $previous);
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }

    public function getPayload(): array
    {
        return $this->payload;
    }

    public function render(): JsonResponse
    {
        return response()->json(array_merge([
            'message' => $this->getMessage(),
            'code' => $this->statusCode,
        ], $this->payload), $this->statusCode);
    }
}
