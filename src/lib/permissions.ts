import { useAuth } from './AuthContext'
import type { Role } from '../types'

/**
 * Miroir front-end de la matrice des droits par rôle (CDC §3.3) et des règles
 * appliquées côté backend (app/routers/*.py — require_role). Le backend reste
 * la frontière de sécurité réelle (cf. CDC §6.1) ; ceci ne sert qu'à masquer les
 * actions non autorisées dans l'interface pour éviter des clics qui échoueront.
 */
const ROLES_STOCK_ECRITURE: Role[] = ['gerant', 'administrateur']
const ROLES_ENCAISSEMENT: Role[] = ['caissier', 'gerant', 'administrateur']
const ROLES_CLIENT: Role[] = ['vendeur', 'caissier', 'gerant', 'administrateur']
const ROLES_COMMANDE_CLIENT: Role[] = ['vendeur', 'caissier', 'gerant', 'administrateur']
const ROLES_COMMANDE_FOURNISSEUR: Role[] = ['gerant', 'responsable_achats', 'administrateur']
const ROLES_DETTE_CREATION: Role[] = ['vendeur', 'caissier', 'gerant', 'administrateur']
const ROLES_REMBOURSEMENT: Role[] = ['caissier', 'gerant', 'administrateur']
const ROLES_TRANSFERT_DEMANDE: Role[] = ['gerant', 'administrateur']
const ROLES_TRANSFERT_VALIDATION: Role[] = ['responsable_achats', 'administrateur']
const ROLES_TRANSFERT_RECEPTION: Role[] = ['vendeur', 'gerant', 'administrateur']
const ROLES_LIVRAISON_GESTION: Role[] = ['gerant', 'administrateur']
const ROLES_DEPENSE_CREATION: Role[] = ['gerant', 'administrateur']
const ROLES_DEPENSE_VALIDATION: Role[] = ['responsable_achats', 'administrateur']
const ROLES_PROMOTION_CREATION: Role[] = ['gerant', 'responsable_achats', 'administrateur']
const ROLES_PROMOTION_VALIDATION: Role[] = ['responsable_achats', 'administrateur']
const ROLES_CAISSE_GESTION: Role[] = ['caissier', 'gerant', 'administrateur']
const ROLES_DASHBOARD: Role[] = ['gerant', 'responsable_achats', 'administrateur']
const ROLES_COMPTABILITE: Role[] = ['gerant', 'responsable_achats', 'administrateur']
const ROLES_PRODUIT_GESTION: Role[] = ['gerant', 'responsable_achats', 'administrateur']
const ROLES_RESEAU: Role[] = ['administrateur']
const ROLES_UTILISATEURS: Role[] = ['administrateur']
const ROLES_SECURITE: Role[] = ['administrateur']
const ROLES_REFERENTIELS: Role[] = ['administrateur']

export interface Permissions {
  role: Role | null
  stockEcriture: boolean
  encaissement: boolean
  client: boolean
  commandeClient: boolean
  commandeFournisseur: boolean
  detteCreation: boolean
  remboursement: boolean
  transfertDemande: boolean
  transfertValidation: boolean
  transfertReception: boolean
  livraisonGestion: boolean
  depenseCreation: boolean
  depenseValidation: boolean
  promotionCreation: boolean
  promotionValidation: boolean
  caisseGestion: boolean
  dashboard: boolean
  comptabilite: boolean
  produitGestion: boolean
  reseau: boolean
  utilisateurs: boolean
  securite: boolean
  referentiels: boolean
}

function build(role: Role | null): Permissions {
  const has = (roles: Role[]) => (role ? roles.includes(role) : false)
  return {
    role,
    stockEcriture: has(ROLES_STOCK_ECRITURE),
    encaissement: has(ROLES_ENCAISSEMENT),
    client: has(ROLES_CLIENT),
    commandeClient: has(ROLES_COMMANDE_CLIENT),
    commandeFournisseur: has(ROLES_COMMANDE_FOURNISSEUR),
    detteCreation: has(ROLES_DETTE_CREATION),
    remboursement: has(ROLES_REMBOURSEMENT),
    transfertDemande: has(ROLES_TRANSFERT_DEMANDE),
    transfertValidation: has(ROLES_TRANSFERT_VALIDATION),
    transfertReception: has(ROLES_TRANSFERT_RECEPTION),
    livraisonGestion: has(ROLES_LIVRAISON_GESTION),
    depenseCreation: has(ROLES_DEPENSE_CREATION),
    depenseValidation: has(ROLES_DEPENSE_VALIDATION),
    promotionCreation: has(ROLES_PROMOTION_CREATION),
    promotionValidation: has(ROLES_PROMOTION_VALIDATION),
    caisseGestion: has(ROLES_CAISSE_GESTION),
    dashboard: has(ROLES_DASHBOARD),
    comptabilite: has(ROLES_COMPTABILITE),
    produitGestion: has(ROLES_PRODUIT_GESTION),
    reseau: has(ROLES_RESEAU),
    utilisateurs: has(ROLES_UTILISATEURS),
    securite: has(ROLES_SECURITE),
    referentiels: has(ROLES_REFERENTIELS),
  }
}

export function usePermissions(): Permissions {
  const { user } = useAuth()
  return build(user?.role ?? null)
}
