import type {
  Boutique,
  Caisse,
  Client as ClientEntity,
  CommandeClient,
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
  ReportingIntelligent,
  SuggestionAvecProduit,
  TransfertStock,
  Utilisateur,
} from '../types'
import { getToken } from '../lib/auth'
import type {
  BoutiqueInput,
  LoginRequest,
  ProduitInput,
  ReferentielInput,
  TokenResponse,
  UtilisateurConnecte,
  UtilisateurInput,
} from '../types/write'

const API_BASE = 'http://localhost:8000/api/v1'

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

export const api = {
  login: (payload: LoginRequest) => sendJson<TokenResponse>('POST', '/auth/login', payload),
  moi: () => getJson<UtilisateurConnecte>('/auth/moi'),

  boutiques: () => getJson<Boutique[]>('/boutiques'),
  boutique: (id: string) => getJson<Boutique>(`/boutiques/${id}`),
  creerBoutique: (payload: BoutiqueInput) => sendJson<Boutique>('POST', '/boutiques', payload),
  modifierBoutique: (id: string, payload: Partial<BoutiqueInput>) => sendJson<Boutique>('PUT', `/boutiques/${id}`, payload),
  supprimerBoutique: (id: string) => sendJson<void>('DELETE', `/boutiques/${id}`),

  fournisseurs: () => getJson<Fournisseur[]>('/fournisseurs'),

  utilisateurs: () => getJson<Utilisateur[]>('/utilisateurs'),
  creerUtilisateur: (payload: UtilisateurInput) => sendJson<Utilisateur>('POST', '/utilisateurs', payload),
  modifierUtilisateur: (id: string, payload: Partial<UtilisateurInput>) => sendJson<Utilisateur>('PUT', `/utilisateurs/${id}`, payload),
  supprimerUtilisateur: (id: string) => sendJson<void>('DELETE', `/utilisateurs/${id}`),
  permissions: () => getJson<PermissionLigne[]>('/permissions'),

  produits: (q?: string) => getJson<Produit[]>(`/produits${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  creerProduit: (payload: ProduitInput) => sendJson<Produit>('POST', '/produits', payload),
  modifierProduit: (id: string, payload: Partial<ProduitInput>) => sendJson<Produit>('PUT', `/produits/${id}`, payload),
  supprimerProduit: (id: string) => sendJson<void>('DELETE', `/produits/${id}`),

  clients: () => getJson<ClientEntity[]>('/clients'),
  paiementsClients: () => getJson<PaiementClient[]>('/paiements-clients'),
  paiementsFournisseurs: () => getJson<PaiementFournisseur[]>('/paiements-fournisseurs'),

  stock: (boutiqueId?: string) => getJson<LigneStock[]>(`/stock${boutiqueId ? `?boutique_id=${boutiqueId}` : ''}`),
  mouvementsStock: (boutiqueId?: string) => getJson<LigneMouvementStock[]>(`/stock/mouvements${boutiqueId ? `?boutique_id=${boutiqueId}` : ''}`),
  inventaire: (boutiqueId?: string) => getJson<LigneEcartInventaire[]>(`/stock/inventaire${boutiqueId ? `?boutique_id=${boutiqueId}` : ''}`),

  caisses: () => getJson<Caisse[]>('/caisse/caisses'),
  mouvementsCaisse: () => getJson<LigneMouvementCaisse[]>('/caisse/mouvements'),

  commandesClients: () => getJson<CommandeClient[]>('/commandes-clients'),
  commandesFournisseurs: () => getJson<LigneCommandeFournisseur[]>('/commandes-fournisseurs'),

  livraisons: () => getJson<Livraison[]>('/livraisons'),
  depenses: () => getJson<Depense[]>('/depenses'),

  dettes: (tiersType: 'client' | 'fournisseur') => getJson<LigneDette[]>(`/dettes?tiers_type=${tiersType}`),
  transferts: () => getJson<TransfertStock[]>('/transferts'),

  comptabilite: () => getJson<ComptabiliteConsolidee>('/comptabilite'),
  promotions: () => getJson<Promotion[]>('/promotions'),

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
