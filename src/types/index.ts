export type Secteur = string
export type StatutBoutique = 'active' | 'fermee' | 'en_creation'
export type Role = 'vendeur' | 'caissier' | 'gerant' | 'responsable_achats' | 'administrateur'
export type DroitAcces = 'complet' | 'lecture_seule' | 'partiel' | 'aucun'
export type SegmentClient = 'nouveau' | 'regulier' | 'fidele' | 'a_risque'
export type StatutDette = 'en_cours' | 'en_retard' | 'soldee'
export type TiersType = 'client' | 'fournisseur'
export type StatutPaiement = 'encaisse' | 'en_attente' | 'paye' | 'partiel'
export type ModePaiement = 'especes' | 'mobile_money' | 'a_la_livraison' | 'credit_client' | 'virement' | 'lettre_change'
export type StatutCaisse = 'ouverte' | 'fermee' | 'ecart_signale'
export type TypeMouvementCaisse = 'encaissement' | 'decaissement'
export type CanalCommande = 'web' | 'mobile_client' | 'boutique'
export type StatutCommandeClient = 'en_attente' | 'confirmee' | 'en_preparation' | 'en_livraison' | 'livree' | 'annulee'
export type StatutCommandeFournisseur = 'brouillon' | 'validee' | 'envoyee' | 'receptionnee_partielle' | 'receptionnee' | 'cloturee'
export type StatutLivraison = 'preparee' | 'en_cours' | 'livree' | 'echec'
export type StatutValidationDepense = 'auto_validee' | 'en_attente' | 'validee_siege'
export type StatutTransfert = 'demande' | 'valide' | 'en_transit' | 'recu'
export type MotifMouvementStock =
  | 'vente_caisse' | 'commande_client' | 'achat_reception_fournisseur' | 'transfert_entrant'
  | 'transfert_sortant' | 'retour_client' | 'casse_perte' | 'peremption' | 'correction_inventaire'
  | 'don_echantillon' | 'autre'
export type StatutEcartInventaire = 'conforme' | 'a_investiguer' | 'corrige'
export type OriginePromotion = 'ia' | 'gerant' | 'direction'
export type StatutPromotion = 'en_attente_validation' | 'validee' | 'active' | 'terminee'
export type StatutStock = 'critique' | 'a_surveiller' | 'correct'

export interface Boutique {
  id: string
  nom: string
  secteurs: Secteur[]
  quartier: string
  commune: string
  ville: string
  horaires: string
  responsable: string
  statut: StatutBoutique
  telephone: string
  latitude: number | null
  longitude: number | null
}

export interface Fournisseur {
  id: string
  nom: string
  secteur: Secteur
  conditions_paiement: string
  contact: string
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

export interface PermissionLigne {
  module_action: string
  droits: Record<Role, DroitAcces>
}

export interface Client {
  id: string
  nom: string
  contact: string
  boutique_id: string
  segment: SegmentClient
  credit_autorise: boolean
  solde_dette: number
  quartier: string | null
  commune: string | null
  ville: string | null
}

export interface PaiementClient {
  id: string
  client_nom: string
  reference: string
  boutique_id: string
  mode_paiement: ModePaiement
  date: string
  montant: number
  statut: StatutPaiement
}

export interface PaiementFournisseur {
  id: string
  fournisseur_nom: string
  reference: string
  boutique_id: string
  mode_paiement: ModePaiement
  date: string
  montant: number
  statut: StatutPaiement
  document_url: string | null
}

export interface ProduitImage {
  id: string
  url: string
  position: number
}

export interface Produit {
  id: string
  nom: string
  secteur: Secteur
  categorie: string
  prix: number
  unite: string
  code_barres: string
  date_peremption: string | null
  images: ProduitImage[]
}

export interface LigneStock {
  boutique_id: string
  produit_id: string
  produit_nom: string
  secteur: Secteur
  quantite_disponible: number
  quantite_reservee: number
  seuil_alerte: number
  statut: StatutStock
  derniere_mouvement: string
}

export interface LigneMouvementStock {
  id: string
  horodatage: string
  produit_id: string
  produit_nom: string
  boutique_id: string
  motif: MotifMouvementStock
  operateur: string
  quantite: number
}

export interface LigneEcartInventaire {
  id: string
  produit_id: string
  produit_nom: string
  boutique_id: string
  theorique: number
  reel: number
  ecart: number
  statut: StatutEcartInventaire
}

export interface Caisse {
  id: string
  boutique_id: string
  libelle: string
  statut: StatutCaisse
  fond_initial: number
  solde_theorique: number
  solde_reel: number
  operateur: string
}

export interface LigneMouvementCaisse {
  id: string
  horodatage: string
  boutique_id: string
  caisse_libelle: string
  type: TypeMouvementCaisse
  motif: string
  operateur: string
  montant: number
}

export interface CommandeClient {
  id: string
  client_nom: string
  boutique_id: string
  canal: CanalCommande
  mode_paiement: ModePaiement
  montant: number
  statut: StatutCommandeClient
}

export interface ArticleCommande {
  id: string
  produit_id: string
  produit_nom: string
  quantite: number
  prix_unitaire: number
}

export interface CommandeClientDetail extends CommandeClient {
  articles: ArticleCommande[]
}

export interface LigneCommandeFournisseur {
  id: string
  fournisseur_id: string
  boutique_id: string
  date_attendue: string
  montant: number
  statut: StatutCommandeFournisseur
}

export interface ArticleCommandeFournisseur extends ArticleCommande {
  quantite_recue: number
}

export interface CommandeFournisseurDetail extends LigneCommandeFournisseur {
  articles: ArticleCommandeFournisseur[]
}

export interface Livraison {
  id: string
  commande_id: string
  livreur: string
  boutique_id: string
  adresse: string
  creneau: string
  statut: StatutLivraison
  preuve_url: string | null
}

export interface Depense {
  id: string
  boutique_id: string
  caisse_id: string | null
  categorie: string
  auteur: string
  date: string
  montant: number
  statut_validation: StatutValidationDepense
  justificatif_url: string | null
}

export interface LigneDette {
  id: string
  tiers_nom: string
  boutique_id: string
  montant_initial: number
  solde_restant: number
  echeance: string
  statut: StatutDette
}

export interface Remboursement {
  id: string
  dette_id: string
  caisse_id: string | null
  montant: number
  mode_paiement: ModePaiement
  date: string
  operateur: string
}

export interface TransfertStock {
  id: string
  produit_id: string
  boutique_source_id: string
  boutique_destination_id: string
  quantite: number
  demandeur: string
  statut: StatutTransfert
}

export interface CompteResultatBoutique {
  boutique_id: string
  chiffre_affaires: number
  achats: number
  depenses: number
  marge_nette: number
}

export interface ComptabiliteConsolidee {
  ca_consolide: number
  marge_nette_consolidee: number
  depenses_consolidees: number
  marge_nette_moyenne_pct: number
  comptes: CompteResultatBoutique[]
}

export interface Promotion {
  id: string
  nom: string
  boutique_id: string | null
  secteur: Secteur | null
  origine: OriginePromotion
  impact_estime: string
  statut: StatutPromotion
}

export interface SuggestionAvecProduit {
  produit_id: string
  produit_nom: string
  boutique_id: string
  stock_actuel: number
  ventes_prevues_14j: number
  quantite_suggeree: number
}

export interface AnomalieReporting {
  id: string
  titre: string
  description: string
}

export interface ReportingIntelligent {
  synthese: string
  anomalies: AnomalieReporting[]
}

export interface ConversationMessage {
  auteur: 'client' | 'bot'
  texte: string
}

export interface JournalAuditEntry {
  id: string
  horodatage: string
  action: string
  auteur: string
  boutique_id: string | null
}

export interface ParametreSecurite {
  label: string
  actif: boolean
}

export interface ReferentielItem {
  id: string
  nom: string
}

export interface LigneComparatifBoutique {
  boutique_id: string
  nom: string
  secteurs: string[]
  ca_jour: number
  stock_en_alerte: number
  dettes_en_cours: number
}

export interface AlerteReseau {
  titre: string
  description: string
}

export interface DashboardConsolide {
  chiffre_affaires_jour: number
  marge_nette_jour: number
  dettes_clients_en_cours: number
  produits_en_alerte_stock: number
  boutiques_concernees_alerte: number
  transferts_en_transit: number
  comparatif_boutiques: LigneComparatifBoutique[]
  alertes: AlerteReseau[]
}

export const STATUT_BOUTIQUE_LABELS: Record<StatutBoutique, string> = {
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

export const SEGMENT_LABELS: Record<SegmentClient, string> = {
  nouveau: 'Nouveau',
  regulier: 'Régulier',
  fidele: 'Fidèle',
  a_risque: 'À risque',
}

export const MODE_PAIEMENT_LABELS: Record<ModePaiement, string> = {
  especes: 'Espèces',
  mobile_money: 'Mobile Money',
  a_la_livraison: 'À la livraison',
  credit_client: 'Crédit client',
  virement: 'Virement',
  lettre_change: 'Lettre de change',
}

export const STATUT_PAIEMENT_LABELS: Record<StatutPaiement, string> = {
  encaisse: 'Encaissé',
  en_attente: 'En attente',
  paye: 'Payé',
  partiel: 'Partiel',
}

export const STATUT_CAISSE_LABELS: Record<StatutCaisse, string> = {
  ouverte: 'Ouverte',
  fermee: 'Fermée',
  ecart_signale: 'Écart signalé',
}

export const CANAL_LABELS: Record<CanalCommande, string> = {
  web: 'Web',
  mobile_client: 'Mobile client',
  boutique: 'Boutique',
}

export const STATUT_COMMANDE_CLIENT_LABELS: Record<StatutCommandeClient, string> = {
  en_attente: 'En attente',
  confirmee: 'Confirmée',
  en_preparation: 'En préparation',
  en_livraison: 'En livraison',
  livree: 'Livrée',
  annulee: 'Annulée',
}

export const STATUT_COMMANDE_FOURNISSEUR_LABELS: Record<StatutCommandeFournisseur, string> = {
  brouillon: 'Brouillon',
  validee: 'Validée',
  envoyee: 'Envoyée',
  receptionnee_partielle: 'Réceptionnée (partielle)',
  receptionnee: 'Réceptionnée',
  cloturee: 'Clôturée',
}

export const STATUT_LIVRAISON_LABELS: Record<StatutLivraison, string> = {
  preparee: 'Préparée',
  en_cours: 'En cours',
  livree: 'Livrée',
  echec: 'Échec',
}

export const STATUT_VALIDATION_DEPENSE_LABELS: Record<StatutValidationDepense, string> = {
  auto_validee: 'Auto-validée',
  en_attente: 'En attente',
  validee_siege: 'Validée — siège',
}

export const STATUT_TRANSFERT_LABELS: Record<StatutTransfert, string> = {
  demande: 'Demandé',
  valide: 'Validé',
  en_transit: 'En transit',
  recu: 'Reçu',
}

export const MOTIF_MOUVEMENT_LABELS: Record<MotifMouvementStock, string> = {
  vente_caisse: 'Vente en caisse',
  commande_client: 'Commande client',
  achat_reception_fournisseur: 'Achat/réception fournisseur',
  transfert_entrant: 'Transfert entrant',
  transfert_sortant: 'Transfert sortant',
  retour_client: 'Retour client',
  casse_perte: 'Casse/perte',
  peremption: 'Péremption',
  correction_inventaire: "Correction d'inventaire",
  don_echantillon: 'Don/échantillon',
  autre: 'Autre',
}

export const STATUT_DETTE_LABELS: Record<StatutDette, string> = {
  en_cours: 'En cours',
  en_retard: 'En retard',
  soldee: 'Soldée',
}

export const STATUT_PROMOTION_LABELS: Record<StatutPromotion, string> = {
  en_attente_validation: 'En attente de validation',
  validee: 'Validée',
  active: 'Active',
  terminee: 'Terminée',
}

export const ORIGINE_PROMOTION_LABELS: Record<OriginePromotion, string> = {
  ia: 'Suggestion IA',
  gerant: 'Gérant de boutique',
  direction: 'Direction commerciale',
}
