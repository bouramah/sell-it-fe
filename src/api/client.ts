import type {
  BaremeCreditBeneficiaire,
  Boutique,
  Caisse,
  Client as ClientEntity,
  CommandeClient,
  CommandeClientDetail,
  CommandeFournisseurDetail,
  ComptabiliteConsolidee,
  ConversationMessage,
  DemandeCredit,
  Etablissement,
  EcritureComptable,
  Beneficiaire,
  EtatStockValorise,
  MargeProduits,
  DashboardConsolide,
  DashboardKpis,
  Depense,
  Fournisseur,
  JournalAuditFiltres,
  JournalAuditPage,
  ProduitRecommande,
  LigneCommandeFournisseur,
  LigneDette,
  LigneEcartInventaire,
  LigneMouvementCaisse,
  LigneMouvementStock,
  LigneStock,
  Livraison,
  PaiementClient,
  PaiementFournisseur,
  ParametreApplication,
  ParametreFiscal,
  ParametreSecurite,
  PermissionLigne,
  PrixAchat,
  PrixPeriode,
  NotificationPushResult,
  Produit,
  Promotion,
  QuartierGeo,
  ReferentielItem,
  Region,
  Remboursement,
  ReportingIntelligent,
  RoleInfo,
  SecteurGeo,
  SuggestionAvecProduit,
  TopClient,
  TopFournisseur,
  TransfertStock,
  Utilisateur,
  ValidationGarantCredit,
  ValidationGarantDetail,
  VersementEtablissement,
  Ville,
  Commune,
  SuiviEtablissement,
} from '../types'
import { clearToken, getToken } from '../lib/auth'
import type {
  BaremeCreditBeneficiaireInput,
  BoutiqueInput,
  CaisseInput,
  ClientInput,
  CommandeClientInput,
  CommandeFournisseurInput,
  CorrectionReceptionInput,
  DemandeCreditBeneficiaireInput,
  DepenseInput,
  DetteInput,
  EtablissementInput,
  EtablissementUpdateInput,
  BeneficiaireInput,
  BeneficiaireUpdateInput,
  FournisseurInput,
  LigneReceptionInput,
  LivraisonInput,
  LoginRequest,
  MouvementCaisseInput,
  MouvementStockInput,
  PaiementCaisseInput,
  PaiementClientInput,
  PaiementFournisseurInput,
  NotificationPushInput,
  PermissionUpdate,
  PrixAchatInput,
  PrixPeriodeInput,
  ProduitCreateInput,
  ProduitUpdateInput,
  PromotionInput,
  QuartierGeoInput,
  ReceptionInput,
  ReferentielInput,
  RegionInput,
  RemboursementInput,
  RoleCreate,
  RoleUpdate,
  SecteurGeoInput,
  StockLigneInput,
  VilleInput,
  CommuneInput,
  TokenResponse,
  TransfertInput,
  UtilisateurConnecte,
  UtilisateurInput,
  ValidationGarantDecisionInput,
  Verifier2FARequest,
  VersementEtablissementInput,
} from '../types/write'

// En dev, VITE_SERVER_BASE pointe vers l'API locale (http://localhost:8000). En prod, laissé
// vide : nginx sert le build et proxy /api + /uploads vers le backend sur la même origine,
// donc des chemins relatifs suffisent — pas besoin de connaître l'IP/domaine au moment du build.
export const SERVER_BASE = import.meta.env.VITE_SERVER_BASE ?? ''
const API_BASE = `${SERVER_BASE}/api/v1`

class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// Distingue ce canal (back-office web) de l'appli mobile interne dans le journal d'audit —
// les deux tapent le même backend/mêmes routes, seul cet en-tête les différencie.
function authHeaders(): Record<string, string> {
  const token = getToken()
  return { 'X-Client-Canal': 'web', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

// FastAPI renvoie `detail` en string pour les erreurs métier (400/403/404/409…) mais en
// tableau d'objets {msg, loc, type} pour les erreurs de validation (422) — sans ce
// formatage, une 422 affichait "[object Object]" à l'utilisateur au lieu du vrai message.
function formatDetail(detail: unknown): string {
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail
      .map((e) => (e && typeof e === 'object' && 'msg' in e ? String((e as { msg: unknown }).msg) : JSON.stringify(e)))
      .join(' ; ')
  }
  return ''
}

async function handle<T>(res: Response, path: string): Promise<T> {
  if (!res.ok) {
    let detail = ''
    try {
      const body = await res.json()
      detail = formatDetail(body.detail)
    } catch {
      // ignore
    }
    // Session expirée ou token invalide : sans ça, chaque écran échoue silencieusement (listes
    // vides sans erreur visible) au lieu de renvoyer l'utilisateur se reconnecter — cf. rapport
    // "connecté en admin mais je ne vois aucune livraison", en réalité un jeton expiré.
    if (res.status === 401) {
      clearToken()
      if (window.location.pathname !== '/login') window.location.href = '/login'
    }
    throw new ApiError(res.status, detail || `Erreur API ${res.status} sur ${path}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// URLSearchParams stringifie `undefined`/`null` en la chaîne littérale "undefined" — sans ce
// filtre, un filtre optionnel non choisi serait envoyé comme "?canal=undefined".
function buildQuery(params?: Record<string, string | number | undefined>): string {
  if (!params) return ''
  const entries = Object.entries(params).filter((e): e is [string, string | number] => e[1] !== undefined && e[1] !== '')
  if (entries.length === 0) return ''
  return `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()}`
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() })
  return handle<T>(res, path)
}

async function sendJson<T>(method: 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  return handle<T>(res, path)
}

async function sendFile<T>(path: string, file: File): Promise<T> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  })
  return handle<T>(res, path)
}

async function downloadFile(path: string, filename: string): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() })
  if (!res.ok) {
    let detail = ''
    try {
      const body = await res.json()
      detail = body.detail ?? ''
    } catch {
      // ignore
    }
    throw new ApiError(res.status, detail || `Erreur API ${res.status} sur ${path}`)
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export const api = {
  login: (payload: LoginRequest) => sendJson<TokenResponse>('POST', '/auth/login', payload),
  verifier2FA: (payload: Verifier2FARequest) => sendJson<TokenResponse>('POST', '/auth/verifier-2fa', payload),
  motDePasseOublie: (contact: string) => sendJson<{ message: string }>('POST', '/auth/mot-de-passe-oublie', { contact }),
  reinitialiserMotDePasse: (contact: string, code: string, nouveauMotDePasse: string) =>
    sendJson<{ message: string }>('POST', '/auth/reinitialiser-mot-de-passe', {
      contact, code, nouveau_mot_de_passe: nouveauMotDePasse,
    }),
  moi: () => getJson<UtilisateurConnecte>('/auth/moi'),

  boutiques: () => getJson<Boutique[]>('/boutiques'),
  boutique: (id: string) => getJson<Boutique>(`/boutiques/${id}`),
  creerBoutique: (payload: BoutiqueInput) => sendJson<Boutique>('POST', '/boutiques', payload),
  modifierBoutique: (id: string, payload: Partial<BoutiqueInput>) => sendJson<Boutique>('PUT', `/boutiques/${id}`, payload),
  supprimerBoutique: (id: string) => sendJson<void>('DELETE', `/boutiques/${id}`),

  fournisseurs: () => getJson<Fournisseur[]>('/fournisseurs'),
  topFournisseurs: (boutiqueId?: string, limite?: number) =>
    getJson<TopFournisseur[]>(`/fournisseurs/top${buildQuery({ boutique_id: boutiqueId, limite })}`),
  creerFournisseur: (payload: FournisseurInput) => sendJson<Fournisseur>('POST', '/fournisseurs', payload),
  modifierFournisseur: (id: string, payload: Partial<FournisseurInput>) => sendJson<Fournisseur>('PUT', `/fournisseurs/${id}`, payload),
  supprimerFournisseur: (id: string) => sendJson<void>('DELETE', `/fournisseurs/${id}`),

  utilisateurs: (boutiqueId?: string) => getJson<Utilisateur[]>(`/utilisateurs${boutiqueId ? `?boutique_id=${boutiqueId}` : ''}`),
  creerUtilisateur: (payload: UtilisateurInput) => sendJson<Utilisateur>('POST', '/utilisateurs', payload),
  modifierUtilisateur: (id: string, payload: Partial<UtilisateurInput>) => sendJson<Utilisateur>('PUT', `/utilisateurs/${id}`, payload),
  supprimerUtilisateur: (id: string) => sendJson<void>('DELETE', `/utilisateurs/${id}`),
  reinitialiserMotDePasseAdmin: (id: string) => sendJson<{ message: string }>('POST', `/utilisateurs/${id}/reinitialiser-mot-de-passe`),
  permissions: () => getJson<PermissionLigne[]>('/permissions'),
  modifierPermission: (payload: PermissionUpdate) => sendJson<PermissionLigne>('PUT', '/permissions', payload),

  roles: () => getJson<RoleInfo[]>('/roles'),
  creerRole: (payload: RoleCreate) => sendJson<RoleInfo>('POST', '/roles', payload),
  modifierRole: (id: string, payload: RoleUpdate) => sendJson<RoleInfo>('PUT', `/roles/${id}`, payload),
  supprimerRole: (id: string) => sendJson<void>('DELETE', `/roles/${id}`),

  produits: (q?: string) => getJson<Produit[]>(`/produits${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  produit: (id: string) => getJson<Produit>(`/produits/${id}`),
  creerProduit: (payload: ProduitCreateInput) => sendJson<Produit>('POST', '/produits', payload),
  modifierProduit: (id: string, payload: ProduitUpdateInput) => sendJson<Produit>('PUT', `/produits/${id}`, payload),
  supprimerProduit: (id: string) => sendJson<void>('DELETE', `/produits/${id}`),
  ajouterImageProduit: (id: string, file: File) => sendFile<Produit>(`/produits/${id}/images`, file),
  supprimerImageProduit: (produitId: string, imageId: string) => sendJson<Produit>('DELETE', `/produits/${produitId}/images/${imageId}`),
  prixPeriodes: (produitId: string, boutiqueId?: string, palier?: string) =>
    getJson<PrixPeriode[]>(`/produits/${produitId}/prix-periodes?${boutiqueId ? `boutique_id=${boutiqueId}&` : ''}${palier ? `palier=${palier}` : ''}`),
  prixADate: (produitId: string, aDate: string, boutiqueId?: string) =>
    getJson<Record<string, number | null>>(`/produits/${produitId}/prix-a-date?a_date=${aDate}${boutiqueId ? `&boutique_id=${boutiqueId}` : ''}`),
  creerPrixPeriode: (produitId: string, payload: PrixPeriodeInput) =>
    sendJson<PrixPeriode>('POST', `/produits/${produitId}/prix-periodes`, payload),
  modifierPrixPeriode: (produitId: string, periodeId: string, payload: PrixPeriodeInput) =>
    sendJson<PrixPeriode>('PUT', `/produits/${produitId}/prix-periodes/${periodeId}`, payload),
  supprimerPrixPeriode: (produitId: string, periodeId: string) =>
    sendJson<void>('DELETE', `/produits/${produitId}/prix-periodes/${periodeId}`),
  prixAchat: (produitId: string, fournisseurId?: string) =>
    getJson<PrixAchat[]>(`/produits/${produitId}/prix-achat${fournisseurId ? `?fournisseur_id=${fournisseurId}` : ''}`),
  creerPrixAchat: (produitId: string, payload: PrixAchatInput) =>
    sendJson<PrixAchat>('POST', `/produits/${produitId}/prix-achat`, payload),
  modifierPrixAchat: (produitId: string, achatId: string, payload: PrixAchatInput) =>
    sendJson<PrixAchat>('PUT', `/produits/${produitId}/prix-achat/${achatId}`, payload),
  supprimerPrixAchat: (produitId: string, achatId: string) =>
    sendJson<void>('DELETE', `/produits/${produitId}/prix-achat/${achatId}`),

  clients: (boutiqueId?: string) => getJson<ClientEntity[]>(`/clients${boutiqueId ? `?boutique_id=${boutiqueId}` : ''}`),
  topClients: (boutiqueId?: string, limite?: number) =>
    getJson<TopClient[]>(`/clients/top${buildQuery({ boutique_id: boutiqueId, limite })}`),
  creerClient: (payload: ClientInput) => sendJson<ClientEntity>('POST', '/clients', payload),
  modifierClient: (id: string, payload: Partial<ClientInput>) => sendJson<ClientEntity>('PUT', `/clients/${id}`, payload),
  supprimerClient: (id: string) => sendJson<void>('DELETE', `/clients/${id}`),
  paiementsClients: (boutiqueId?: string) => getJson<PaiementClient[]>(`/paiements-clients${boutiqueId ? `?boutique_id=${boutiqueId}` : ''}`),
  creerPaiementClient: (payload: PaiementClientInput) => sendJson<PaiementClient>('POST', '/paiements-clients', payload),
  encaisserPaiementClient: (id: string, payload: PaiementCaisseInput) => sendJson<PaiementClient>('POST', `/paiements-clients/${id}/encaisser`, payload),
  paiementsFournisseurs: (boutiqueId?: string) => getJson<PaiementFournisseur[]>(`/paiements-fournisseurs${boutiqueId ? `?boutique_id=${boutiqueId}` : ''}`),
  creerPaiementFournisseur: (payload: PaiementFournisseurInput) => sendJson<PaiementFournisseur>('POST', '/paiements-fournisseurs', payload),
  payerPaiementFournisseur: (id: string, payload: PaiementCaisseInput) => sendJson<PaiementFournisseur>('POST', `/paiements-fournisseurs/${id}/payer`, payload),
  uploaderDocumentPaiementFournisseur: (id: string, file: File) => sendFile<PaiementFournisseur>(`/paiements-fournisseurs/${id}/document`, file),
  supprimerDocumentPaiementFournisseur: (id: string) => sendJson<PaiementFournisseur>('DELETE', `/paiements-fournisseurs/${id}/document`),

  stock: (boutiqueId?: string) => getJson<LigneStock[]>(`/stock${boutiqueId ? `?boutique_id=${boutiqueId}` : ''}`),
  creerLigneStock: (payload: StockLigneInput) => sendJson<LigneStock>('POST', '/stock', payload),
  modifierLigneStock: (boutiqueId: string, produitId: string, payload: Partial<StockLigneInput>) =>
    sendJson<LigneStock>('PUT', `/stock/${boutiqueId}/${produitId}`, payload),
  supprimerLigneStock: (boutiqueId: string, produitId: string) => sendJson<void>('DELETE', `/stock/${boutiqueId}/${produitId}`),
  mouvementsStock: (boutiqueId?: string) => getJson<LigneMouvementStock[]>(`/stock/mouvements${boutiqueId ? `?boutique_id=${boutiqueId}` : ''}`),
  creerMouvementStock: (payload: MouvementStockInput) => sendJson<LigneMouvementStock>('POST', '/stock/mouvements', payload),
  inventaire: (boutiqueId?: string) => getJson<LigneEcartInventaire[]>(`/stock/inventaire${boutiqueId ? `?boutique_id=${boutiqueId}` : ''}`),

  caisses: (boutiqueId?: string) => getJson<Caisse[]>(`/caisse/caisses${boutiqueId ? `?boutique_id=${boutiqueId}` : ''}`),
  creerCaisse: (payload: CaisseInput) => sendJson<Caisse>('POST', '/caisse/caisses', payload),
  fermerCaisse: (id: string, soldeReel: number) => sendJson<Caisse>('POST', `/caisse/caisses/${id}/fermer`, { solde_reel: soldeReel }),
  rouvrirCaisse: (id: string) => sendJson<Caisse>('POST', `/caisse/caisses/${id}/rouvrir`),
  mouvementsCaisse: (boutiqueId?: string) => getJson<LigneMouvementCaisse[]>(`/caisse/mouvements${boutiqueId ? `?boutique_id=${boutiqueId}` : ''}`),
  creerMouvementCaisse: (payload: MouvementCaisseInput) => sendJson<LigneMouvementCaisse>('POST', '/caisse/mouvements', payload),

  commandesClients: () => getJson<CommandeClient[]>('/commandes-clients'),
  commandeClient: (id: string) => getJson<CommandeClientDetail>(`/commandes-clients/${id}`),
  creerCommandeClient: (payload: CommandeClientInput) => sendJson<CommandeClientDetail>('POST', '/commandes-clients', payload),
  modifierCommandeClient: (id: string, statut: string) => sendJson<CommandeClient>('PUT', `/commandes-clients/${id}`, { statut }),
  modifierArticlesCommandeClient: (id: string, payload: Omit<CommandeClientInput, 'statut'>) =>
    sendJson<CommandeClientDetail>('PUT', `/commandes-clients/${id}`, payload),
  validerRemiseCommandeClient: (id: string) => sendJson<CommandeClientDetail>('PUT', `/commandes-clients/${id}/valider-remise`),

  commandesFournisseurs: () => getJson<LigneCommandeFournisseur[]>('/commandes-fournisseurs'),
  commandeFournisseur: (id: string) => getJson<CommandeFournisseurDetail>(`/commandes-fournisseurs/${id}`),
  creerCommandeFournisseur: (payload: CommandeFournisseurInput) => sendJson<CommandeFournisseurDetail>('POST', '/commandes-fournisseurs', payload),
  modifierCommandeFournisseur: (id: string, statut: string) => sendJson<LigneCommandeFournisseur>('PUT', `/commandes-fournisseurs/${id}`, { statut }),
  modifierArticlesCommandeFournisseur: (id: string, payload: Omit<CommandeFournisseurInput, 'statut'>) =>
    sendJson<CommandeFournisseurDetail>('PUT', `/commandes-fournisseurs/${id}`, payload),
  receptionnerCommandeFournisseur: (id: string, payload: ReceptionInput) =>
    sendJson<CommandeFournisseurDetail>('POST', `/commandes-fournisseurs/${id}/reception`, payload),
  corrigerReceptionCommandeFournisseur: (id: string, payload: CorrectionReceptionInput) =>
    sendJson<CommandeFournisseurDetail>('PUT', `/commandes-fournisseurs/${id}/reception`, payload),

  livraisons: () => getJson<Livraison[]>('/livraisons'),
  creerLivraison: (payload: LivraisonInput) => sendJson<Livraison>('POST', '/livraisons', payload),
  modifierStatutLivraison: (id: string, statut: string) => sendJson<Livraison>('PUT', `/livraisons/${id}/statut`, { statut }),
  uploaderPreuveLivraison: (id: string, file: File) => sendFile<Livraison>(`/livraisons/${id}/preuve`, file),
  supprimerPreuveLivraison: (id: string) => sendJson<Livraison>('DELETE', `/livraisons/${id}/preuve`),

  depenses: () => getJson<Depense[]>('/depenses'),
  creerDepense: (payload: DepenseInput) => sendJson<Depense>('POST', '/depenses', payload),
  validerDepense: (id: string) => sendJson<Depense>('POST', `/depenses/${id}/valider`),
  uploaderJustificatifDepense: (id: string, file: File) => sendFile<Depense>(`/depenses/${id}/justificatif`, file),
  supprimerJustificatifDepense: (id: string) => sendJson<Depense>('DELETE', `/depenses/${id}/justificatif`),

  dettes: (tiersType: 'client' | 'fournisseur') => getJson<LigneDette[]>(`/dettes?tiers_type=${tiersType}`),
  creerDette: (payload: DetteInput) => sendJson<LigneDette>('POST', '/dettes', payload),
  encaisserRemboursement: (detteId: string, payload: RemboursementInput) =>
    sendJson<LigneDette>('POST', `/dettes/${detteId}/remboursements`, payload),
  remboursements: (detteId?: string) => getJson<Remboursement[]>(`/dettes/remboursements${detteId ? `?dette_id=${detteId}` : ''}`),
  envoyerRappelSms: (detteId: string) => sendJson<LigneDette>('POST', `/dettes/${detteId}/rappel-sms`, undefined),
  demandesCredit: (boutiqueId?: string) => getJson<DemandeCredit[]>(`/dettes/demandes-credit${buildQuery({ boutique_id: boutiqueId })}`),
  validerDemandeCredit: (id: string) => sendJson<DemandeCredit>('POST', `/dettes/demandes-credit/${id}/valider`, undefined),
  refuserDemandeCredit: (id: string) => sendJson<DemandeCredit>('POST', `/dettes/demandes-credit/${id}/refuser`, undefined),
  validationsGarantDemande: (id: string) => getJson<ValidationGarantCredit[]>(`/dettes/demandes-credit/${id}/validations-garant`),

  // --- Aide Humanitaire ---------------------------------------------------------
  etablissements: () => getJson<Etablissement[]>('/etablissements'),
  creerEtablissement: (payload: EtablissementInput) => sendJson<Etablissement>('POST', '/etablissements', payload),
  modifierEtablissement: (id: string, payload: EtablissementUpdateInput) => sendJson<Etablissement>('PUT', `/etablissements/${id}`, payload),
  supprimerEtablissement: (id: string) => sendJson<void>('DELETE', `/etablissements/${id}`),

  beneficiaires: (etablissementId?: string) => getJson<Beneficiaire[]>(`/beneficiaires${buildQuery({ etablissement_id: etablissementId })}`),
  beneficiaire: (id: string) => getJson<Beneficiaire>(`/beneficiaires/${id}`),
  creerBeneficiaire: (payload: BeneficiaireInput) => sendJson<Beneficiaire>('POST', '/beneficiaires', payload),
  modifierBeneficiaire: (id: string, payload: BeneficiaireUpdateInput) => sendJson<Beneficiaire>('PUT', `/beneficiaires/${id}`, payload),
  uploaderEngagementBeneficiaire: (id: string, file: File) => sendFile<Beneficiaire>(`/beneficiaires/${id}/engagement`, file),
  supprimerEngagementBeneficiaire: (id: string) => sendJson<Beneficiaire>('DELETE', `/beneficiaires/${id}/engagement`),
  creerDemandeCreditBeneficiaire: (id: string, payload: DemandeCreditBeneficiaireInput) =>
    sendJson<Beneficiaire>('POST', `/beneficiaires/${id}/demandes-credit`, payload),
  telechargerCarteMembre: (id: string) => downloadFile(`/beneficiaires/${id}/carte-membre.pdf`, `carte-membre-${id}.pdf`),

  baremeCreditBeneficiaires: (etablissementId?: string) =>
    getJson<BaremeCreditBeneficiaire[]>(`/parametres/bareme-credit-beneficiaires${buildQuery({ etablissement_id: etablissementId })}`),
  creerBaremeCreditBeneficiaire: (payload: BaremeCreditBeneficiaireInput) =>
    sendJson<BaremeCreditBeneficiaire>('POST', '/parametres/bareme-credit-beneficiaires', payload),
  supprimerBaremeCreditBeneficiaire: (id: string) => sendJson<void>('DELETE', `/parametres/bareme-credit-beneficiaires/${id}`),

  suiviAideHumanitaire: () => getJson<SuiviEtablissement[]>('/aide-humanitaire/dashboard'),
  dettesEnCoursEtablissement: (etablissementId: string) => getJson<LigneDette[]>(`/aide-humanitaire/etablissements/${etablissementId}/dettes-en-cours`),
  versementsEtablissements: (etablissementId?: string) => getJson<VersementEtablissement[]>(`/aide-humanitaire/versements${buildQuery({ etablissement_id: etablissementId })}`),
  creerVersementEtablissement: (payload: VersementEtablissementInput) => sendJson<VersementEtablissement>('POST', '/aide-humanitaire/versements', payload),
  uploaderJustificatifVersement: (id: string, file: File) => sendFile<VersementEtablissement>(`/aide-humanitaire/versements/${id}/justificatif`, file),

  // Public — aucune authentification (le jeton SMS EST l'authentification)
  consulterValidationGarant: (token: string) => getJson<ValidationGarantDetail>(`/validation-garant/${token}`),
  repondreValidationGarant: (token: string, payload: ValidationGarantDecisionInput) =>
    sendJson<ValidationGarantDetail>('POST', `/validation-garant/${token}`, payload),

  transferts: () => getJson<TransfertStock[]>('/transferts'),
  creerTransfert: (payload: TransfertInput) => sendJson<TransfertStock>('POST', '/transferts', payload),
  modifierStatutTransfert: (id: string, statut: string, lignes?: LigneReceptionInput[]) =>
    sendJson<TransfertStock>('PUT', `/transferts/${id}/statut`, { statut, lignes }),

  comptabilite: () => getJson<ComptabiliteConsolidee>('/comptabilite'),
  journalComptable: (boutiqueId?: string) =>
    getJson<EcritureComptable[]>(`/comptabilite/journal${boutiqueId ? `?boutique_id=${boutiqueId}` : ''}`),
  stockValorise: (boutiqueId?: string) =>
    getJson<EtatStockValorise>(`/comptabilite/stock-valorise${boutiqueId ? `?boutique_id=${boutiqueId}` : ''}`),
  margeProduits: (debut: string, fin: string, boutiqueId?: string, produitId?: string) => {
    const params = new URLSearchParams({ debut, fin })
    if (boutiqueId) params.set('boutique_id', boutiqueId)
    if (produitId) params.set('produit_id', produitId)
    return getJson<MargeProduits>(`/comptabilite/marge-produits?${params.toString()}`)
  },
  exporterComptabiliteXlsx: () => downloadFile('/comptabilite/export.xlsx', 'comptabilite-kfstore.xlsx'),
  promotions: () => getJson<Promotion[]>('/promotions'),
  creerPromotion: (payload: PromotionInput) => sendJson<Promotion>('POST', '/promotions', payload),
  modifierStatutPromotion: (id: string, statut: string) => sendJson<Promotion>('PUT', `/promotions/${id}/statut`, { statut }),

  telechargerBonCommande: (commandeId: string) =>
    downloadFile(`/commandes-fournisseurs/${commandeId}/bon-commande.pdf`, `bon-commande-${commandeId}.pdf`),
  telechargerBonReception: (commandeId: string) =>
    downloadFile(`/commandes-fournisseurs/${commandeId}/bon-reception.pdf`, `bon-reception-${commandeId}.pdf`),
  telechargerFacture: (commandeId: string) =>
    downloadFile(`/commandes-clients/${commandeId}/facture.pdf`, `facture-${commandeId}.pdf`),
  telechargerRecu: (paiementId: string) =>
    downloadFile(`/paiements-clients/${paiementId}/recu.pdf`, `recu-${paiementId}.pdf`),

  previsions: (boutiqueId?: string) => getJson<SuggestionAvecProduit[]>(`/ia/previsions${buildQuery({ boutique_id: boutiqueId })}`),
  iaRecherche: (q: string, boutiqueId?: string, secteur?: string) =>
    getJson<ProduitRecommande[]>(`/ia/recherche${buildQuery({ q, boutique_id: boutiqueId, secteur })}`),
  iaTendances: (boutiqueId?: string, secteur?: string) =>
    getJson<ProduitRecommande[]>(`/ia/tendances${buildQuery({ boutique_id: boutiqueId, secteur })}`),
  iaSimilaires: (produitId: string, boutiqueId?: string) =>
    getJson<ProduitRecommande[]>(`/ia/produits/${produitId}/similaires${buildQuery({ boutique_id: boutiqueId })}`),
  iaComplementaires: (produitId: string, boutiqueId?: string) =>
    getJson<ProduitRecommande[]>(`/ia/produits/${produitId}/complementaires${buildQuery({ boutique_id: boutiqueId })}`),
  reporting: () => getJson<ReportingIntelligent>('/ia/reporting'),
  chatbotConfig: () => getJson<Record<string, boolean>>('/ia/chatbot/config'),
  chatbotTester: (message: string, historique: ConversationMessage[]) =>
    sendJson<{ reponse: string }>('POST', '/ia/chatbot/tester', { message, historique }),

  audit: (filtres?: JournalAuditFiltres) => getJson<JournalAuditPage>(`/securite/audit${buildQuery(filtres)}`),
  parametresSecurite: () => getJson<ParametreSecurite[]>('/securite/parametres'),
  modifierParametreSecurite: (id: string, actif: boolean) => sendJson<ParametreSecurite>('PUT', `/securite/parametres/${id}`, { actif }),
  parametresApplication: () => getJson<ParametreApplication[]>('/parametres/application'),
  modifierParametreApplication: (id: string, actif: boolean) => sendJson<ParametreApplication>('PUT', `/parametres/application/${id}`, { actif }),
  parametreFiscal: () => getJson<ParametreFiscal>('/parametres/fiscal'),
  modifierParametreFiscal: (taux: number, actif: boolean) => sendJson<ParametreFiscal>('PUT', '/parametres/fiscal', { taux, actif }),

  referentiels: () => getJson<Record<string, ReferentielItem[]>>('/parametres/referentiels'),
  creerReferentiel: (categorie: string, payload: ReferentielInput) =>
    sendJson<ReferentielItem>('POST', `/parametres/referentiels/${categorie}`, payload),
  modifierReferentiel: (categorie: string, id: string, payload: ReferentielInput) =>
    sendJson<ReferentielItem>('PUT', `/parametres/referentiels/${categorie}/${id}`, payload),
  supprimerReferentiel: (categorie: string, id: string) =>
    sendJson<void>('DELETE', `/parametres/referentiels/${categorie}/${id}`),

  regions: () => getJson<Region[]>('/regions'),
  creerRegion: (payload: RegionInput) => sendJson<Region>('POST', '/regions', payload),
  supprimerRegion: (id: string) => sendJson<void>('DELETE', `/regions/${id}`),

  villes: (regionId?: string) => getJson<Ville[]>(`/villes${regionId ? `?region_id=${regionId}` : ''}`),
  creerVille: (payload: VilleInput) => sendJson<Ville>('POST', '/villes', payload),
  supprimerVille: (id: string) => sendJson<void>('DELETE', `/villes/${id}`),

  communes: (villeId?: string) => getJson<Commune[]>(`/communes${villeId ? `?ville_id=${villeId}` : ''}`),
  creerCommune: (payload: CommuneInput) => sendJson<Commune>('POST', '/communes', payload),
  supprimerCommune: (id: string) => sendJson<void>('DELETE', `/communes/${id}`),

  quartiersGeo: (communeId?: string) => getJson<QuartierGeo[]>(`/quartiers-geo${communeId ? `?commune_id=${communeId}` : ''}`),
  creerQuartierGeo: (payload: QuartierGeoInput) => sendJson<QuartierGeo>('POST', '/quartiers-geo', payload),
  supprimerQuartierGeo: (id: string) => sendJson<void>('DELETE', `/quartiers-geo/${id}`),

  secteursGeo: (quartierId?: string) => getJson<SecteurGeo[]>(`/secteurs-geo${quartierId ? `?quartier_id=${quartierId}` : ''}`),
  creerSecteurGeo: (payload: SecteurGeoInput) => sendJson<SecteurGeo>('POST', '/secteurs-geo', payload),
  supprimerSecteurGeo: (id: string) => sendJson<void>('DELETE', `/secteurs-geo/${id}`),

  envoyerNotificationPush: (payload: NotificationPushInput) =>
    sendJson<NotificationPushResult>('POST', '/notifications/push', payload),

  dashboard: () => getJson<DashboardConsolide>('/dashboard'),
  dashboardKpis: (debut: string, fin: string, boutiqueId?: string) => {
    const params = new URLSearchParams({ debut, fin })
    if (boutiqueId) params.set('boutique_id', boutiqueId)
    return getJson<DashboardKpis>(`/dashboard/kpis?${params.toString()}`)
  },
}
