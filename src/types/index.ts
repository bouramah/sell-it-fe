export type Secteur = string
export type StatutBoutique = 'active' | 'fermee' | 'en_creation'
// Les rôles sont des données (table `roles`, gérable depuis Utilisateurs & droits), pas un
// type fixe — voir RoleInfo pour le schéma complet (id, libellé, portée).
export type Role = string
export type PorteeRole = 'boutique' | 'reseau'
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
  secteur_geo_id: string | null
}

export interface Region {
  id: string
  nom: string
}

export interface Ville {
  id: string
  nom: string
  region_id: string
}

export interface Commune {
  id: string
  nom: string
  ville_id: string
}

export interface QuartierGeo {
  id: string
  nom: string
  commune_id: string
}

export interface SecteurGeo {
  id: string
  nom: string
  quartier_id: string
}

export interface NotificationPushResult {
  destinataires: number
  notifies: number
}

export interface Fournisseur {
  id: string
  nom: string
  secteur: Secteur
  conditions_paiement: string
  contact: string
  secteur_geo_id: string | null
}

export interface TopFournisseur {
  fournisseur_id: string
  fournisseur_nom: string
  montant_achats: number
  nombre_commandes: number
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
  secteur_geo_id: string | null
}

export interface PermissionLigne {
  module_action: string
  droits: Record<Role, DroitAcces>
}

export interface RoleInfo {
  id: string
  libelle: string
  portee: PorteeRole
  systeme: boolean
}

export interface Client {
  id: string
  nom: string
  contact: string
  boutique_ids: string[]
  segment: SegmentClient
  credit_autorise: boolean
  solde_dette: number
  quartier: string | null
  commune: string | null
  ville: string | null
  secteur_geo_id: string | null
}

export interface TopClient {
  client_id: string
  client_nom: string
  chiffre_affaires: number
  nombre_commandes: number
}

export interface PaiementClient {
  id: string
  client_nom: string
  reference: string
  boutique_id: string
  caisse_id: string | null
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
  caisse_id: string | null
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

export type PalierPrix = 'detail' | 'semi_gros' | 'gros'

export const PALIER_PRIX_LABELS: Record<PalierPrix, string> = {
  detail: 'Détail',
  semi_gros: 'Semi-gros',
  gros: 'Gros',
}

export interface Produit {
  id: string
  nom: string
  secteur: Secteur
  categorie: string
  prix_detail: number
  prix_semi_gros: number
  prix_gros: number
  seuil_semi_gros: number
  seuil_gros: number
  unite: string
  code_barres: string
  date_peremption: string | null
  images: ProduitImage[]
}

export interface PrixPeriode {
  id: string
  produit_id: string
  boutique_id: string | null
  palier: PalierPrix
  prix: number
  date_debut: string
  date_fin: string | null
  modifie_par: string
  cree_le: string
}

export interface PrixAchat {
  id: string
  produit_id: string
  fournisseur_id: string
  palier: PalierPrix
  prix: number
  date_debut: string
  date_fin: string | null
  modifie_par: string
  cree_le: string
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
  prix_detail: number
  prix_semi_gros: number
  prix_gros: number
}

export function prixPourPalier(ligne: { prix_detail: number; prix_semi_gros: number; prix_gros: number }, palier: PalierPrix): number {
  if (palier === 'gros') return ligne.prix_gros
  if (palier === 'semi_gros') return ligne.prix_semi_gros
  return ligne.prix_detail
}

export function palierSuggere(quantite: number, produit: { seuil_semi_gros: number; seuil_gros: number }): PalierPrix {
  if (quantite >= produit.seuil_gros) return 'gros'
  if (quantite >= produit.seuil_semi_gros) return 'semi_gros'
  return 'detail'
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
  stock_avant: number
  stock_apres: number
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
  solde_avant: number
  solde_apres: number
}

export type StatutValidationRemise = 'aucune' | 'en_attente' | 'validee'

export interface CommandeClient {
  id: string
  client_nom: string
  boutique_id: string
  canal: CanalCommande
  mode_paiement: ModePaiement
  montant: number
  statut: StatutCommandeClient
  remise_statut: StatutValidationRemise
  remise_motif: string | null
  remise_validee_par: string | null
  remise_validee_le: string | null
}

export interface ArticleCommande {
  id: string
  produit_id: string
  produit_nom: string
  quantite: number
  palier: PalierPrix
  prix_unitaire: number
  prix_catalogue_a_la_vente: number | null
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

export interface ArticleCommandeFournisseur {
  id: string
  produit_id: string
  produit_nom: string
  quantite: number
  prix_unitaire: number
  quantite_recue: number
}

export interface CommandeFournisseurDetail extends LigneCommandeFournisseur {
  articles: ArticleCommandeFournisseur[]
}

export interface Livraison {
  id: string
  commande_id: string
  livreur: string
  livreur_user_id: string | null
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

export type StatutDemandeCredit = 'en_attente' | 'validee' | 'refusee'

export interface DemandeCredit {
  id: string
  client_id: string
  client_nom: string
  boutique_id: string
  montant_souhaite: number
  motif: string
  statut: StatutDemandeCredit
  date_creation: string
}

// --- Aide Humanitaire -----------------------------------------------------------

export type StatutEtablissement = 'active' | 'inactive'
export type TypeGarant = 'referent' | 'comptabilite'
export type StatutValidationGarant = 'en_attente' | 'validee' | 'refusee'

export interface Etablissement {
  id: string
  nom: string
  type_etablissement: string
  adresse: string | null
  referent_nom: string
  referent_contact: string
  comptabilite_nom: string
  comptabilite_contact: string
  statut: StatutEtablissement
}

export interface Beneficiaire {
  id: string
  client_id: string
  client_nom: string
  client_contact: string
  etablissement_id: string
  etablissement_nom: string
  numero_membre: string
  poste: string
  salaire_reference: number | null
  engagement_signe_url: string | null
  engagement_signe_date: string | null
  plafond_suspendu: boolean
  plafond_disponible: number
  credit_autorise: boolean
}

export interface BaremeCreditBeneficiaire {
  id: string
  etablissement_id: string | null
  etablissement_nom: string | null
  poste: string
  plafond: number
  date_debut: string
  date_fin: string | null
}

export interface ValidationGarantCredit {
  id: string
  type_garant: TypeGarant
  nom_garant: string
  statut: StatutValidationGarant
  date_reponse: string | null
  motif_refus: string | null
}

export interface ValidationGarantDetail {
  beneficiaire_nom: string
  etablissement_nom: string
  poste: string
  montant_souhaite: number
  motif: string
  salaire_reference: number | null
  type_garant: TypeGarant
  statut: StatutValidationGarant
  autre_garant_statut: StatutValidationGarant
  expire_le: string
}

export interface VersementEtablissement {
  id: string
  etablissement_id: string
  etablissement_nom: string
  montant: number
  date: string
  reference: string | null
  justificatif_url: string | null
  note: string | null
}

export interface SuiviEtablissement {
  etablissement_id: string
  etablissement_nom: string
  nombre_beneficiaires: number
  credits_en_cours: number
  credits_en_retard: number
  montant_verse: number
  ecart: number
}

export interface LigneTransfertStock {
  id: string
  produit_id: string
  produit_nom: string
  quantite: number
  quantite_recue: number | null
  motif_ecart: string | null
}

export interface TransfertStock {
  id: string
  boutique_source_id: string
  boutique_destination_id: string
  demandeur: string
  statut: StatutTransfert
  lignes: LigneTransfertStock[]
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

export interface EcritureComptable {
  id: string
  date: string
  boutique_id: string
  nature: string
  sens: string
  montant: number
  libelle: string
  auteur: string | null
  operation_source_type: string
  operation_source_id: string
}

export interface LigneStockValorise {
  boutique_id: string
  produit_id: string
  produit_nom: string
  quantite: number
  cout_unitaire_moyen: number | null
  valeur: number
}

export interface EtatStockValorise {
  lignes: LigneStockValorise[]
  valeur_totale: number
}

export interface LigneMargeProduit {
  produit_id: string
  produit_nom: string
  quantite_vendue: number
  chiffre_affaires: number
  cout_total: number | null
  marge: number | null
  marge_pct: number | null
}

export interface MargeProduits {
  date_debut: string
  date_fin: string
  boutique_id: string | null
  chiffre_affaires_total: number
  marge_totale: number | null
  lignes: LigneMargeProduit[]
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
  confiance: 'faible' | 'moyenne' | 'haute'
}

export interface ProduitRecommande {
  id: string
  nom: string
  secteur: string
  categorie: string
  unite: string
  images: string[]
  prix_detail: number
  disponible: number
  raison: string
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
  utilisateur_id: string | null
  client_id: string | null
  canal: string | null
  methode: string | null
  chemin: string | null
  statut_code: number | null
}

export interface JournalAuditPage {
  items: JournalAuditEntry[]
  total: number
}

export interface JournalAuditFiltres {
  [key: string]: string | number | undefined
  boutique_id?: string
  utilisateur_id?: string
  client_id?: string
  canal?: string
  methode?: string
  q?: string
  date_debut?: string
  date_fin?: string
  page?: number
  taille?: number
}

export interface ParametreSecurite {
  id: string
  label: string
  actif: boolean
}

export interface ParametreApplication {
  id: string
  label: string
  actif: boolean
}

export interface ParametreFiscal {
  taux: number
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

export interface KpiCanal {
  canal: CanalCommande
  montant: number
  nombre: number
}

export interface KpiModePaiement {
  mode: ModePaiement
  montant: number
}

export interface KpiTopProduit {
  produit_id: string
  produit_nom: string
  quantite: number
  montant: number
}

export interface KpiTopBoutique {
  boutique_id: string
  nom: string
  montant: number
}

export interface KpiVentes {
  chiffre_affaires: number
  nombre_commandes: number
  panier_moyen: number
  par_canal: KpiCanal[]
  par_mode_paiement: KpiModePaiement[]
  top_produits: KpiTopProduit[]
  top_boutiques: KpiTopBoutique[]
}

export interface KpiCaisse {
  encaissements: number
  decaissements: number
  flux_net: number
}

export interface KpiStock {
  entrees: number
  sorties: number
}

export interface KpiFinance {
  depenses: number
  marge_nette: number
  dettes_clients_en_cours: number
}

export interface BoutiqueCarte {
  boutique_id: string
  nom: string
  latitude: number | null
  longitude: number | null
  ca_periode: number
  alertes_stock: number
}

export interface PointSerieVentes {
  horodatage: string
  chiffre_affaires: number
  nombre_commandes: number
  encaissements: number
}

export interface DashboardKpis {
  debut: string
  fin: string
  ventes: KpiVentes
  caisse: KpiCaisse
  stock: KpiStock
  finance: KpiFinance
  boutiques: BoutiqueCarte[]
  serie_ventes: PointSerieVentes[]
}

export const STATUT_BOUTIQUE_LABELS: Record<StatutBoutique, string> = {
  active: 'Active',
  fermee: 'Fermée',
  en_creation: 'En création',
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
