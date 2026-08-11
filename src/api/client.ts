import type {
  Boutique,
  Caisse,
  Client as ClientEntity,
  CommandeClient,
  CommandeClientDetail,
  CommandeFournisseurDetail,
  ComptabiliteConsolidee,
  ConversationMessage,
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
  ParametreSecurite,
  PermissionLigne,
  Produit,
  Promotion,
  ReferentielItem,
  Remboursement,
  ReportingIntelligent,
  RoleInfo,
  SuggestionAvecProduit,
  TransfertStock,
  Utilisateur,
} from '../types'
import { getToken } from '../lib/auth'
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
  PermissionUpdate,
  ProduitInput,
  PromotionInput,
  ReceptionInput,
  ReferentielInput,
  RemboursementInput,
  RoleCreate,
  RoleUpdate,
  StockLigneInput,
  TokenResponse,
  TransfertInput,
  UtilisateurConnecte,
  UtilisateurInput,
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

async function handle<T>(res: Response, path: string): Promise<T> {
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

async function downloadPdf(path: string, filename: string): Promise<void> {
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
  permissions: () => getJson<PermissionLigne[]>('/permissions'),
  modifierPermission: (payload: PermissionUpdate) => sendJson<PermissionLigne>('PUT', '/permissions', payload),

  roles: () => getJson<RoleInfo[]>('/roles'),
  creerRole: (payload: RoleCreate) => sendJson<RoleInfo>('POST', '/roles', payload),
  modifierRole: (id: string, payload: RoleUpdate) => sendJson<RoleInfo>('PUT', `/roles/${id}`, payload),
  supprimerRole: (id: string) => sendJson<void>('DELETE', `/roles/${id}`),

  produits: (q?: string) => getJson<Produit[]>(`/produits${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  produit: (id: string) => getJson<Produit>(`/produits/${id}`),
  creerProduit: (payload: ProduitInput) => sendJson<Produit>('POST', '/produits', payload),
  modifierProduit: (id: string, payload: Partial<ProduitInput>) => sendJson<Produit>('PUT', `/produits/${id}`, payload),
  supprimerProduit: (id: string) => sendJson<void>('DELETE', `/produits/${id}`),
  ajouterImageProduit: (id: string, file: File) => sendFile<Produit>(`/produits/${id}/images`, file),
  supprimerImageProduit: (produitId: string, imageId: string) => sendJson<Produit>('DELETE', `/produits/${produitId}/images/${imageId}`),

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
  modifierStatutTransfert: (id: string, statut: string) => sendJson<TransfertStock>('PUT', `/transferts/${id}/statut`, { statut }),

  comptabilite: () => getJson<ComptabiliteConsolidee>('/comptabilite'),
  promotions: () => getJson<Promotion[]>('/promotions'),
  creerPromotion: (payload: PromotionInput) => sendJson<Promotion>('POST', '/promotions', payload),
  modifierStatutPromotion: (id: string, statut: string) => sendJson<Promotion>('PUT', `/promotions/${id}/statut`, { statut }),

  telechargerBonCommande: (commandeId: string) =>
    downloadPdf(`/commandes-fournisseurs/${commandeId}/bon-commande.pdf`, `bon-commande-${commandeId}.pdf`),
  telechargerBonReception: (commandeId: string) =>
    downloadPdf(`/commandes-fournisseurs/${commandeId}/bon-reception.pdf`, `bon-reception-${commandeId}.pdf`),
  telechargerFacture: (commandeId: string) =>
    downloadPdf(`/commandes-clients/${commandeId}/facture.pdf`, `facture-${commandeId}.pdf`),
  telechargerRecu: (paiementId: string) =>
    downloadPdf(`/paiements-clients/${paiementId}/recu.pdf`, `recu-${paiementId}.pdf`),

  previsions: () => getJson<SuggestionAvecProduit[]>('/ia/previsions'),
  reporting: () => getJson<ReportingIntelligent>('/ia/reporting'),
  chatbotConfig: () => getJson<Record<string, boolean>>('/ia/chatbot/config'),
  chatbotDemo: () => getJson<ConversationMessage[]>('/ia/chatbot/conversation-demo'),

  audit: () => getJson<JournalAuditEntry[]>('/securite/audit'),
  parametresSecurite: () => getJson<ParametreSecurite[]>('/securite/parametres'),
  modifierParametreSecurite: (id: string, actif: boolean) => sendJson<ParametreSecurite>('PUT', `/securite/parametres/${id}`, { actif }),

  referentiels: () => getJson<Record<string, ReferentielItem[]>>('/parametres/referentiels'),
  creerReferentiel: (categorie: string, payload: ReferentielInput) =>
    sendJson<ReferentielItem>('POST', `/parametres/referentiels/${categorie}`, payload),
  modifierReferentiel: (categorie: string, id: string, payload: ReferentielInput) =>
    sendJson<ReferentielItem>('PUT', `/parametres/referentiels/${categorie}/${id}`, payload),
  supprimerReferentiel: (categorie: string, id: string) =>
    sendJson<void>('DELETE', `/parametres/referentiels/${categorie}/${id}`),

  dashboard: () => getJson<DashboardConsolide>('/dashboard'),
  dashboardKpis: (debut: string, fin: string, boutiqueId?: string) => {
    const params = new URLSearchParams({ debut, fin })
    if (boutiqueId) params.set('boutique_id', boutiqueId)
    return getJson<DashboardKpis>(`/dashboard/kpis?${params.toString()}`)
  },
}
