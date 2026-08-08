export type Secteur = 'habillement' | 'alimentation_generale' | 'electronique_electromenager'
export type StatutBoutique = 'active' | 'fermee' | 'en_creation'
export type Role = 'vendeur' | 'caissier' | 'gerant' | 'responsable_achats' | 'administrateur'
export type DroitAcces = 'complet' | 'lecture_seule' | 'partiel' | 'aucun'

export interface Boutique {
  id: string
  nom: string
  secteurs: Secteur[]
  quartier: string
  commune: string
  ville: string
  adresse: string
  statut: StatutBoutique
  responsable: string
  horaires: string
  telephone: string
}

export interface Utilisateur {
  id: string
  nom: string
  prenom: string
  contact: string
  role: Role
  boutique_ids: string[]
  statut: string
  derniere_connexion: string | null
}

export interface LigneStock {
  boutique_id: string
  produit_id: string
  produit_nom: string
  quantite_disponible: number
  quantite_reservee: number
  seuil_alerte: number
  en_alerte: boolean
  derniere_mouvement: string
}

export interface PermissionLigne {
  module_action: string
  droits: Record<Role, DroitAcces>
}

export interface TopBoutique {
  boutique_id: string
  nom: string
  ville: string
  chiffre_affaires: number
}

export interface AlerteStock {
  boutique_id: string
  boutique_nom: string
  produit_nom: string
  quantite_disponible: number
  seuil_alerte: number
}

export interface DashboardConsolide {
  chiffre_affaires: number
  marge: number
  stock_total_valorise: number
  dettes_creances_en_cours: number
  depenses_mois: number
  nb_boutiques_actives: number
  nb_boutiques_total: number
  top_boutiques: TopBoutique[]
  alertes_stock: AlerteStock[]
}

export const SECTEUR_LABELS: Record<Secteur, string> = {
  habillement: 'Habillement',
  alimentation_generale: 'Alimentation générale',
  electronique_electromenager: 'Électronique / Électroménager',
}

export const STATUT_LABELS: Record<StatutBoutique, string> = {
  active: 'Active',
  fermee: 'Fermée',
  en_creation: 'En création',
}

export const ROLE_LABELS: Record<Role, string> = {
  vendeur: 'Vendeur',
  caissier: 'Caissier',
  gerant: 'Gérant',
  responsable_achats: 'Responsable achats',
  administrateur: 'Administrateur',
}
