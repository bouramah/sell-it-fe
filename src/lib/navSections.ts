import type { Permissions } from './permissions'

export interface NavItem {
  to: string
  label: string
  end?: boolean
  /** Si fourni, l'item n'est affiché que si ce champ de la matrice des droits est vrai. */
  visible?: (p: Permissions) => boolean
}

export interface NavSection {
  title: string
  items: NavItem[]
}

/**
 * Source unique de vérité pour la navigation : utilisée à la fois pour construire le
 * menu latéral (Layout) et pour déterminer la première page accessible à un rôle
 * (redirection depuis "/", cf. Home.tsx) — évite que ces deux logiques divergent.
 */
export const sections: NavSection[] = [
  { title: 'Pilotage', items: [{ to: '/', label: 'Tableau de bord', end: true, visible: (p) => p.dashboard }] },
  {
    title: 'Réseau',
    items: [
      { to: '/boutiques', label: 'Boutiques' },
      { to: '/produits', label: 'Produits' },
      { to: '/fournisseurs', label: 'Fournisseurs' },
      { to: '/utilisateurs', label: 'Utilisateurs & droits', visible: (p) => p.utilisateurs },
    ],
  },
  {
    title: 'Clients & paiements',
    items: [
      { to: '/clients', label: 'Clients' },
      { to: '/paiements-clients', label: 'Paiements clients' },
      { to: '/paiements-fournisseurs', label: 'Paiements fournisseurs' },
    ],
  },
  {
    title: 'Opérations',
    items: [
      { to: '/stock', label: 'Stocks' },
      { to: '/caisse', label: 'Caisse' },
      { to: '/commandes-clients', label: 'Commandes clients' },
      { to: '/commandes-fournisseurs', label: 'Commandes fournisseurs' },
      { to: '/livraisons', label: 'Livraisons' },
      { to: '/depenses', label: 'Dépenses' },
      { to: '/dettes', label: 'Dettes & créances' },
      { to: '/transferts', label: 'Transferts de stock' },
    ],
  },
  {
    title: 'Finance & marketing',
    items: [
      { to: '/comptabilite', label: 'Comptabilité', visible: (p) => p.comptabilite },
      { to: '/promotions', label: 'Promotions & tarifs' },
    ],
  },
  {
    // Recherche floue, co-achat, tendances, vitesse de vente (§4.2/§4.3), et depuis le
    // 2026-08-17 chatbot + reporting réels via OpenAI (§4.4/§4.7, cf. IaProvider).
    title: 'Intelligence artificielle',
    items: [
      { to: '/catalogue', label: 'Catalogue & recherche' },
      { to: '/previsions', label: 'Prévisions de demande' },
      { to: '/chatbot', label: 'Chatbot service client' },
      { to: '/reporting', label: 'Reporting intelligent' },
    ],
  },
  { title: 'Sécurité', items: [{ to: '/securite', label: 'Sécurité & audit', visible: (p) => p.securite }] },
  {
    title: 'Communication',
    items: [{ to: '/notifications-push', label: 'Notifications push', visible: (p) => p.utilisateurs }],
  },
  {
    title: 'Aide aux Enseignants',
    items: [
      { to: '/ecoles', label: 'Écoles partenaires', visible: (p) => p.ecoleGestion },
      { to: '/enseignants', label: 'Enseignants', visible: (p) => p.enseignantGestion },
      { to: '/aide-enseignants', label: 'Suivi crédits enseignants', visible: (p) => p.enseignantGestion || p.ecoleGestion },
    ],
  },
  {
    title: 'Configuration',
    items: [
      { to: '/parametres', label: 'Paramètres' },
      { to: '/geographie', label: 'Découpage géographique' },
    ],
  },
]
