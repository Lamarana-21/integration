<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasUuids, Notifiable;

    protected $fillable = [
        'nom',
        'prenom',
        'email',
        'password',
        'role_id',
        'entreprise_id',
        'statut',
        'derniere_connexion',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'derniere_connexion' => 'datetime',
        ];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'entreprise_id');
    }

    public function candidat(): HasOne
    {
        return $this->hasOne(Candidat::class, 'utilisateur_id');
    }

    public function offres(): HasMany
    {
        return $this->hasMany(Offre::class, 'auteur_id');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class, 'utilisateur_id');
    }

    public function notesInternes(): HasMany
    {
        return $this->hasMany(NoteInterne::class, 'auteur_id');
    }

    public function hasPermission(string $permissionName): bool
    {
        if (!$this->role) {
            return false;
        }

        // Admin has all permissions by default
        if ($this->role->nom === 'ADMIN') {
            return true;
        }

        return $this->role->hasPermission($permissionName);
    }

    public function isAdmin(): bool
    {
        return $this->role?->nom === 'ADMIN';
    }

    public function isRecruteur(): bool
    {
        return $this->role?->nom === 'RECRUTEUR';
    }

    public function isCandidat(): bool
    {
        return $this->role?->nom === 'CANDIDAT';
    }
}
