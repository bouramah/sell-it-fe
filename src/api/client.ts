import type {
  Boutique,
  Caisse,
  Client as ClientEntity,
  CommandeClient,
  CommandeClientDetail,
  CommandeFournisseurDetail,
  ComptabiliteConsolidee,
  ConversationMessage,
  EcritureComptable,
  EtatStockValorise,
  DashboardConsolide,
  DashboardKpis,
  Depense,
  Fournisseur,
  JournalAuditEntry,
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
  TransfertStock,
  Utilisateur,
  Ville,
  Commune,
} from '../types'
import { clearToken, getToken } from '../lib/auth'
import type {
  BoutiqueInput,
  CaisseInput,
  ClientInput,
  CommandeClientInput,
  CommandeFournisseurInput,
  CorrectionReceptionInput,
  DepenseInput,
  DetteInput,
  FournisseurInput,
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
  Verifier2FARequest,
} from '../types/write'

const API_BASE = 'http://localhost:8000/api/v1'
export const SERVER_BASE = 'http://localhost:8000'

class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
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

  transferts: () => getJson<TransfertStock[]>('/transferts'),
  creerTransfert: (payload: TransfertInput) => sendJson<TransfertStock>('POST', '/transferts', payload),
  modifierStatutTransfert: (id: string, statut: string, quantiteRecue?: number, motifEcart?: string) =>
    sendJson<TransfertStock>('PUT', `/transferts/${id}/statut`, { statut, quantite_recue: quantiteRecue, motif_ecart: motifEcart }),

  comptabilite: () => getJson<ComptabiliteConsolidee>('/comptabilite'),
  journalComptable: (boutiqueId?: string) =>
    getJson<EcritureComptable[]>(`/comptabilite/journal${boutiqueId ? `?boutique_id=${boutiqueId}` : ''}`),
  stockValorise: (boutiqueId?: string) =>
    getJson<EtatStockValorise>(`/comptabilite/stock-valorise${boutiqueId ? `?boutique_id=${boutiqueId}` : ''}`),
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

  previsions: () => getJson<SuggestionAvecProduit[]>('/ia/previsions'),
  reporting: () => getJson<ReportingIntelligent>('/ia/reporting'),
  chatbotConfig: () => getJson<Record<string, boolean>>('/ia/chatbot/config'),
  chatbotDemo: () => getJson<ConversationMessage[]>('/ia/chatbot/conversation-demo'),

  audit: () => getJson<JournalAuditEntry[]>('/securite/audit'),
  parametresSecurite: () => getJson<ParametreSecurite[]>('/securite/parametres'),
  modifierParametreSecurite: (id: string, actif: boolean) => sendJson<ParametreSecurite>('PUT', `/securite/parametres/${id}`, { actif }),
  parametresApplication: () => getJson<ParametreApplication[]>('/parametres/application'),
  modifierParametreApplication: (id: string, actif: boolean) => sendJson<ParametreApplication>('PUT', `/parametres/application/${id}`, { actif }),

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
