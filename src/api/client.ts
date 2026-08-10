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
  ProduitInput,
  PromotionInput,
  ReceptionInput,
  ReferentielInput,
  RemboursementInput,
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

export const api = {
  login: (payload: LoginRequest) => sendJson<TokenResponse>('POST', '/auth/login', payload),
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

  utilisateurs: () => getJson<Utilisateur[]>('/utilisateurs'),
  creerUtilisateur: (payload: UtilisateurInput) => sendJson<Utilisateur>('POST', '/utilisateurs', payload),
  modifierUtilisateur: (id: string, payload: Partial<UtilisateurInput>) => sendJson<Utilisateur>('PUT', `/utilisateurs/${id}`, payload),
  supprimerUtilisateur: (id: string) => sendJson<void>('DELETE', `/utilisateurs/${id}`),
  permissions: () => getJson<PermissionLigne[]>('/permissions'),

  produits: (q?: string) => getJson<Produit[]>(`/produits${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  produit: (id: string) => getJson<Produit>(`/produits/${id}`),
  creerProduit: (payload: ProduitInput) => sendJson<Produit>('POST', '/produits', payload),
  modifierProduit: (id: string, payload: Partial<ProduitInput>) => sendJson<Produit>('PUT', `/produits/${id}`, payload),
  supprimerProduit: (id: string) => sendJson<void>('DELETE', `/produits/${id}`),
  uploaderImageProduit: (id: string, file: File) => sendFile<Produit>(`/produits/${id}/image`, file),
  supprimerImageProduit: (id: string) => sendJson<Produit>('DELETE', `/produits/${id}/image`),

  clients: () => getJson<ClientEntity[]>('/clients'),
  creerClient: (payload: ClientInput) => sendJson<ClientEntity>('POST', '/clients', payload),
  modifierClient: (id: string, payload: Partial<ClientInput>) => sendJson<ClientEntity>('PUT', `/clients/${id}`, payload),
  supprimerClient: (id: string) => sendJson<void>('DELETE', `/clients/${id}`),
  paiementsClients: () => getJson<PaiementClient[]>('/paiements-clients'),
  paiementsFournisseurs: () => getJson<PaiementFournisseur[]>('/paiements-fournisseurs'),
  payerPaiementFournisseur: (id: string) => sendJson<PaiementFournisseur>('POST', `/paiements-fournisseurs/${id}/payer`),
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

  caisses: () => getJson<Caisse[]>('/caisse/caisses'),
  creerCaisse: (payload: CaisseInput) => sendJson<Caisse>('POST', '/caisse/caisses', payload),
  fermerCaisse: (id: string, soldeReel: number) => sendJson<Caisse>('POST', `/caisse/caisses/${id}/fermer`, { solde_reel: soldeReel }),
  rouvrirCaisse: (id: string) => sendJson<Caisse>('POST', `/caisse/caisses/${id}/rouvrir`),
  mouvementsCaisse: () => getJson<LigneMouvementCaisse[]>('/caisse/mouvements'),
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

  transferts: () => getJson<TransfertStock[]>('/transferts'),
  creerTransfert: (payload: TransfertInput) => sendJson<TransfertStock>('POST', '/transferts', payload),
  modifierStatutTransfert: (id: string, statut: string) => sendJson<TransfertStock>('PUT', `/transferts/${id}/statut`, { statut }),

  comptabilite: () => getJson<ComptabiliteConsolidee>('/comptabilite'),
  promotions: () => getJson<Promotion[]>('/promotions'),
  creerPromotion: (payload: PromotionInput) => sendJson<Promotion>('POST', '/promotions', payload),
  modifierStatutPromotion: (id: string, statut: string) => sendJson<Promotion>('PUT', `/promotions/${id}/statut`, { statut }),

  urlBonCommande: (commandeId: string) => `${API_BASE}/commandes-fournisseurs/${commandeId}/bon-commande.pdf`,
  urlBonReception: (commandeId: string) => `${API_BASE}/commandes-fournisseurs/${commandeId}/bon-reception.pdf`,
  urlFacture: (commandeId: string) => `${API_BASE}/commandes-clients/${commandeId}/facture.pdf`,
  urlRecu: (paiementId: string) => `${API_BASE}/paiements-clients/${paiementId}/recu.pdf`,

  previsions: () => getJson<SuggestionAvecProduit[]>('/ia/previsions'),
  reporting: () => getJson<ReportingIntelligent>('/ia/reporting'),
  chatbotConfig: () => getJson<Record<string, boolean>>('/ia/chatbot/config'),
  chatbotDemo: () => getJson<ConversationMessage[]>('/ia/chatbot/conversation-demo'),

  audit: () => getJson<JournalAuditEntry[]>('/securite/audit'),
  parametresSecurite: () => getJson<ParametreSecurite[]>('/securite/parametres'),

  referentiels: () => getJson<Record<string, ReferentielItem[]>>('/parametres/referentiels'),
  creerReferentiel: (categorie: string, payload: ReferentielInput) =>
    sendJson<ReferentielItem>('POST', `/parametres/referentiels/${categorie}`, payload),
  modifierReferentiel: (categorie: string, id: string, payload: ReferentielInput) =>
    sendJson<ReferentielItem>('PUT', `/parametres/referentiels/${categorie}/${id}`, payload),
  supprimerReferentiel: (categorie: string, id: string) =>
    sendJson<void>('DELETE', `/parametres/referentiels/${categorie}/${id}`),

  dashboard: () => getJson<DashboardConsolide>('/dashboard'),
}
