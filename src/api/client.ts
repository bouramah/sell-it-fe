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

const API_BASE = 'http://localhost:8000/api/v1'

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) {
    throw new Error(`Erreur API ${res.status} sur ${path}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  boutiques: () => getJson<Boutique[]>('/boutiques'),
  boutique: (id: string) => getJson<Boutique>(`/boutiques/${id}`),
  fournisseurs: () => getJson<Fournisseur[]>('/fournisseurs'),
  utilisateurs: () => getJson<Utilisateur[]>('/utilisateurs'),
  permissions: () => getJson<PermissionLigne[]>('/permissions'),

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

  catalogue: (q?: string) => getJson<Produit[]>(`/ia/catalogue${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  previsions: () => getJson<SuggestionAvecProduit[]>('/ia/previsions'),
  reporting: () => getJson<ReportingIntelligent>('/ia/reporting'),
  chatbotConfig: () => getJson<Record<string, boolean>>('/ia/chatbot/config'),
  chatbotDemo: () => getJson<ConversationMessage[]>('/ia/chatbot/conversation-demo'),

  audit: () => getJson<JournalAuditEntry[]>('/securite/audit'),
  parametresSecurite: () => getJson<ParametreSecurite[]>('/securite/parametres'),

  referentiels: () => getJson<Record<string, ReferentielItem[]>>('/parametres/referentiels'),

  dashboard: () => getJson<DashboardConsolide>('/dashboard'),
}
