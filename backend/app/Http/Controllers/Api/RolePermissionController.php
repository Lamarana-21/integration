<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RolePermissionController extends Controller
{
    /**
     * Module 2.1 : Lister les rôles et leurs permissions
     */
    public function getRoles(): JsonResponse
    {
        $roles = Role::with('permissions')->get();

        return response()->json(['roles' => $roles]);
    }

    /**
     * Module 2.1 : Créer un rôle
     */
    public function storeRole(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom' => 'required|string|unique:roles,nom|max:50',
            'description' => 'nullable|string',
        ]);

        $role = Role::create([
            'nom' => strtoupper(trim($validated['nom'])),
            'description' => $validated['description'] ?? null,
        ]);

        $rawPerms = $request->input('permission_ids') ?? $request->input('permissions') ?? [];
        if (!empty($rawPerms) && is_array($rawPerms)) {
            $validPermIds = Permission::whereIn('id', $rawPerms)
                ->orWhereIn('nom', $rawPerms)
                ->pluck('id')
                ->toArray();
            $role->permissions()->sync($validPermIds);
        }

        return response()->json([
            'message' => 'Rôle créé avec succès',
            'role' => $role->load('permissions'),
        ], 201);
    }

    /**
     * Trouver un rôle par son ID ou son Nom
     */
    private function resolveRole(string $idOrName): Role
    {
        $role = Role::where('id', $idOrName)
            ->orWhere('nom', strtoupper($idOrName))
            ->first();

        if (!$role && str_starts_with($idOrName, 'r-')) {
            $cleaned = strtoupper(substr($idOrName, 2));
            $role = Role::where('nom', $cleaned)->first();
        }

        if (!$role) {
            abort(404, "Rôle [{$idOrName}] non trouvé");
        }

        return $role;
    }

    /**
     * Module 2.1 : Consulter un rôle spécifique
     */
    public function showRole(string $id): JsonResponse
    {
        $role = $this->resolveRole($id)->load('permissions');

        return response()->json(['role' => $role]);
    }

    /**
     * Module 2.1 : Modifier un rôle
     */
    public function updateRole(Request $request, string $id): JsonResponse
    {
        $role = $this->resolveRole($id);

        $validated = $request->validate([
            'nom' => "sometimes|required|string|max:50|unique:roles,nom,{$role->id}",
            'description' => 'nullable|string',
        ]);

        $role->update($validated);

        return response()->json([
            'message' => 'Rôle mis à jour',
            'role' => $role->load('permissions'),
        ]);
    }

    /**
     * Module 2.1 : Supprimer un rôle
     */
    public function deleteRole(string $id): JsonResponse
    {
        $role = $this->resolveRole($id);

        // Bloquer la suppression des rôles système majeurs
        if (in_array($role->nom, ['ADMIN', 'RECRUTEUR', 'CANDIDAT'])) {
            return response()->json([
                'message' => 'Impossible de supprimer un rôle système de base',
            ], 422);
        }

        $role->delete();

        return response()->json(['message' => 'Rôle supprimé avec succès']);
    }

    /**
     * Module 2.2 : Consulter la liste des permissions disponibles
     */
    public function getPermissions(): JsonResponse
    {
        $permissions = Permission::all();

        return response()->json(['permissions' => $permissions]);
    }

    /**
     * Module 2.3 & RM9 : Associer ou retirer des permissions à un rôle
     * RM9 : Une permission retirée à un rôle s'applique à tous les comptes dès la requête suivante
     */
    public function updateRolePermissions(Request $request, string $roleId): JsonResponse
    {
        $role = $this->resolveRole($roleId);

        $rawPerms = $request->input('permission_ids') ?? $request->input('permissions') ?? [];
        if (!is_array($rawPerms)) {
            $rawPerms = [];
        }

        // Résolution intelligente : accepter UUID ou nom de permission (ex: 'CREER_OFFRE')
        $validPermIds = Permission::whereIn('id', $rawPerms)
            ->orWhereIn('nom', $rawPerms)
            ->pluck('id')
            ->toArray();

        $role->permissions()->sync($validPermIds);

        return response()->json([
            'message' => 'Permissions du rôle mises à jour avec succès (RM9)',
            'role' => $role->load('permissions'),
        ]);
    }
}
