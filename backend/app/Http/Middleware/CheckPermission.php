<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Authentification requise.'], 401);
        }

        if (!$user->hasPermission($permission)) {
            return response()->json([
                'message' => "Action refusée : permission requise [{$permission}].",
            ], 403);
        }

        return $next($request);
    }
}
