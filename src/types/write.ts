import type {
  CanalCommande,
  DroitAcces,
  ModePaiement,
  MotifMouvementStock,
  PalierPrix,
  Role,
  Secteur,
  SegmentClient,
  StatutBoutique,
  StatutCommandeClient,
  StatutCommandeFournisseur,
  TiersType,
  TypeMouvementCaisse,
} from './index'

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
  latitude?: number | null
  longitude?: number | null
  secteur_geo_id?: string | null
}

export interface RegionInput {
  nom: string
}

export interface VilleInput {
  nom: string
  region_id: string
}

export interface CommuneInput {
  nom: string
  ville_id: string
}

export interface QuartierGeoInput {
  nom: string
  commune_id: string
}

export interface SecteurGeoInput {
  nom: string
  quartier_id: string
}

export interface UtilisateurInput {
  nom: string
  prenom: string
  contact: string
  mot_de_passe: string
  role: Role
  boutique_ids: string[]
  statut: string
  secteur_geo_id?: string | null
}

export interface ProduitCreateInput {
  nom: string
  secteur: Secteur
  categorie: string
  // Prix de départ — crée la première période de validité réseau (aujourd'hui, sans fin).
  prix_detail: number
  prix_semi_gros: number
  prix_gros: number
  seuil_semi_gros: number
  seuil_gros: number
  unite: string
  code_barres: string
  date_peremption: string | null
}

export interface ProduitUpdateInput {
  // Pas de champs de prix ici : un changement de prix passe par prix-periodes (période datée,
  // traçable, sans chevauchement) — jamais par une simple modification de fiche produit.
  nom?: string
  secteur?: Secteur
  categorie?: string
  seuil_semi_gros?: number
  seuil_gros?: number
  unite?: string
  code_barres?: string
  date_peremption?: string | null
}

export interface PrixPeriodeInput {
  boutique_id: string | null
  palier: PalierPrix
  prix: number
  date_debut: string
  date_fin: string | null
}

export interface PrixAchatInput {
  fournisseur_id: string
  palier: PalierPrix
  prix: number
  date_debut: string
  date_fin: string | null
}

export interface PrixBoutiqueInput {
  prix_detail?: number | null
  prix_semi_gros?: number | null
  prix_gros?: number | null
}

export interface ReferentielInput {
  nom: string
}

export interface PermissionUpdate {
  module_action: string
  role: Role
  droit: DroitAcces
}

export interface RoleCreate {
  id: string
  libelle: string
  portee: 'boutique' | 'reseau'
}

export interface RoleUpdate {
  libelle?: string
  portee?: 'boutique' | 'reseau'
}

export interface FournisseurInput {
  nom: string
  secteur: Secteur
  conditions_paiement: string
  contact: string
  secteur_geo_id?: string | null
}

export interface ClientInput {
  nom: string
  contact: string
  boutique_ids: string[]
  segment: SegmentClient
  credit_autorise: boolean
  quartier?: string | null
  commune?: string | null
  ville?: string | null
  secteur_geo_id?: string | null
}

export interface StockLigneInput {
  boutique_id: string
  produit_id: string
  quantite_disponible: number
  quantite_reservee: number
  seuil_alerte: number
}

export interface MouvementStockInput {
  produit_id: string
  boutique_id: string
  motif: MotifMouvementStock
  operateur: string
  quantite: number
}

export interface CaisseInput {
  boutique_id: string
  libelle: string
  fond_initial: number
  operateur: string
}

export interface MouvementCaisseInput {
  caisse_id: string
  type: TypeMouvementCaisse
  motif: string
  operateur: string
  montant: number
}

export interface ArticleCommandeInput {
  produit_id: string
  quantite: number
  palier?: PalierPrix
  prix_unitaire?: number | null
}

export interface CommandeClientInput {
  client_nom: string
  boutique_id: string
  canal: CanalCommande
  mode_paiement: ModePaiement
  statut: StatutCommandeClient
  articles: ArticleCommandeInput[]
  remise_motif?: string | null
}

export interface CommandeFournisseurInput {
  fournisseur_id: string
  boutique_id: string
  date_attendue: string
  statut: StatutCommandeFournisseur
  articles: ArticleCommandeInput[]
}

export interface ReceptionLigneInput {
  produit_id: string
  quantite: number
}

export interface ReceptionInput {
  operateur: string
  lignes: ReceptionLigneInput[]
}

export interface CorrectionReceptionLigneInput {
  produit_id: string
  quantite_recue: number
}

export interface CorrectionReceptionInput {
  operateur: string
  lignes: CorrectionReceptionLigneInput[]
}

export interface PaiementClientInput {
  client_nom: string
  commande_id?: string | null
  boutique_id: string
  caisse_id: string
  mode_paiement: ModePaiement
  montant: number
  date_paiement?: string | null
}

export interface PaiementFournisseurInput {
  fournisseur_nom: string
  commande_id?: string | null
  boutique_id: string
  caisse_id: string
  mode_paiement: ModePaiement
  montant: number
  date_paiement?: string | null
}

export interface PaiementCaisseInput {
  caisse_id: string
}

export interface LivraisonInput {
  commande_id: string
  livreur: string
  livreur_user_id?: string | null
  boutique_id: string
  adresse: string
  creneau: string
}

export interface DepenseInput {
  boutique_id: string
  caisse_id: string
  categorie: string
  auteur: string
  date: string
  montant: number
}

export interface DetteInput {
  tiers_type: TiersType
  tiers_nom: string
  boutique_id: string
  montant_initial: number
  echeance: string
}

export interface RemboursementInput {
  caisse_id: string
  montant: number
  mode_paiement: ModePaiement
  operateur: string
}

export interface PromotionInput {
  nom: string
  boutique_id: string | null
  secteur: Secteur | null
  impact_estime: string
}

export interface TransfertInput {
  produit_id: string
  boutique_source_id: string
  boutique_destination_id: string
  quantite: number
  demandeur: string
}

export interface NotificationPushInput {
  cible: 'utilisateur' | 'boutique'
  utilisateur_id?: string | null
  boutique_id?: string | null
  titre: string
  message: string
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
