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
            'permission_ids' => 'nullable|array',
            'permission_ids.*' => 'uuid|exists:permissions,id',
        ]);

        $role = Role::create([
            'nom' => strtoupper($validated['nom']),
            'description' => $validated['description'] ?? null,
        ]);

        if (!empty($validated['permission_ids'])) {
            $role->permissions()->sync($validated['permission_ids']);
        }

        return response()->json([
            'message' => 'Rôle créé avec succès',
            'role' => $role->load('permissions'),
        ], 201);
    }

    /**
     * Module 2.1 : Modifier un rôle
     */
    public function updateRole(Request $request, string $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        $validated = $request->validate([
            'nom' => "sometimes|required|string|max:50|unique:roles,nom,{$id}",
            'description' => 'nullable|string',
        ]);

        $role->update($validated);

        return response()->json([
            'message' => 'Rôle mis à jour',
            'role' => $role,
        ]);
    }

    /**
     * Module 2.1 : Supprimer un rôle
     */
    public function deleteRole(string $id): JsonResponse
    {
        $role = Role::findOrFail($id);

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
        $role = Role::findOrFail($roleId);

        $request->validate([
            'permission_ids' => 'required|array',
            'permission_ids.*' => 'uuid|exists:permissions,id',
        ]);

        $role->permissions()->sync($request->permission_ids);

        return response()->json([
            'message' => 'Permissions du rôle mises à jour avec succès',
            'role' => $role->load('permissions'),
        ]);
    }
}
