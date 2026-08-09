import type { Role, Secteur, StatutBoutique } from './index'

export interface BoutiqueInput {
  nom: string
  secteurs: Secteur[]
  quartier: string
  commune: string
  ville: string
  horaires: string
  responsable: string
  statut: StatutBoutique
  telephone: string
}

export interface UtilisateurInput {
  nom: string
  prenom: string
  contact: string
  mot_de_passe: string
  role: Role
  boutique_ids: string[]
  statut: string
}

export interface ProduitInput {
  nom: string
  secteur: Secteur
  categorie: string
  prix: number
  unite: string
  code_barres: string
  date_peremption: string | null
}

export interface ReferentielInput {
  nom: string
}

export interface LoginRequest {
  contact: string
  mot_de_passe: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface UtilisateurConnecte {
  id: string
  nom: string
  prenom: string
  contact: string
  role: Role
  boutique_ids: string[]
}
