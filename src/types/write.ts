import type {
  CanalCommande,
  DroitAcces,
  ModePaiement,
  MotifMouvementStock,
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

export interface PermissionUpdate {
  module_action: string
  role: Role
  droit: DroitAcces
}

export interface FournisseurInput {
  nom: string
  secteur: Secteur
  conditions_paiement: string
  contact: string
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
  prix_unitaire?: number | null
}

export interface CommandeClientInput {
  client_nom: string
  boutique_id: string
  canal: CanalCommande
  mode_paiement: ModePaiement
  statut: StatutCommandeClient
  articles: ArticleCommandeInput[]
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
