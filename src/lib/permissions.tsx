import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '../api/client'
import { useAuth } from './AuthContext'
import { MODULE_ACTIONS } from './moduleActions'
import type { PermissionLigne, Role } from '../types'

/**
 * Miroir front-end de la matrice des droits par rôle, servie en direct depuis
 * l'API (/permissions) — pas de rôles codés en dur ici. Le backend reste la
 * frontière de sécurité réelle (cf. CDC §6.1) ; ceci ne sert qu'à masquer les
 * actions non autorisées dans l'interface pour éviter des clics qui échoueront.
 * Miroir de backend/app/core/authorization.py::require_permission, y compris
 * le contournement administrateur (voir hasAccess ci-dessous).
 */

interface PermissionsState {
  matrix: PermissionLigne[]
  loading: boolean
}

const PermissionsContext = createContext<PermissionsState>({ matrix: [], loading: true })

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [state, setState] = useState<PermissionsState>({ matrix: [], loading: true })

  useEffect(() => {
    if (!user) {
      setState({ matrix: [], loading: false })
      return
    }
    setState((s) => ({ ...s, loading: true }))
    api.permissions()
      .then((matrix) => setState({ matrix, loading: false }))
      .catch(() => setState({ matrix: [], loading: false }))
  }, [user?.id])

  return <PermissionsContext.Provider value={state}>{children}</PermissionsContext.Provider>
}

/** true tant que la matrice des droits du rôle courant n'a pas encore été chargée depuis l'API. */
export function usePermissionsLoading(): boolean {
  return useContext(PermissionsContext).loading
}

function hasAccess(matrix: PermissionLigne[], role: Role | null, ...moduleActions: string[]): boolean {
  if (!role) return false
  if (role === 'administrateur') return true
  return moduleActions.some((action) => {
    const row = matrix.find((r) => r.module_action === action)
    return row ? row.droits[role] !== 'aucun' : false
  })
}

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
  fournisseurGestion: boolean
  reseau: boolean
  utilisateurs: boolean
  securite: boolean
  referentiels: boolean
  remiseValidation: boolean
  etablissementGestion: boolean
  beneficiaireGestion: boolean
  baremeCreditBeneficiaireGestion: boolean
}

export function usePermissions(): Permissions {
  const { user } = useAuth()
  const { matrix } = useContext(PermissionsContext)
  const role = user?.role ?? null
  const has = (...actions: string[]) => hasAccess(matrix, role, ...actions)

  return {
    role,
    stockEcriture: has(MODULE_ACTIONS.STOCK_ECRITURE),
    encaissement: has(MODULE_ACTIONS.ENCAISSEMENT),
    client: has(MODULE_ACTIONS.CLIENT_GESTION),
    commandeClient: has(MODULE_ACTIONS.COMMANDE_CLIENT),
    commandeFournisseur: has(MODULE_ACTIONS.COMMANDE_FOURNISSEUR_CREATION, MODULE_ACTIONS.COMMANDE_FOURNISSEUR_RECEPTION),
    detteCreation: has(MODULE_ACTIONS.DETTE_CREATION),
    remboursement: has(MODULE_ACTIONS.DETTE_REMBOURSEMENT),
    transfertDemande: has(MODULE_ACTIONS.TRANSFERT_DEMANDE),
    transfertValidation: has(MODULE_ACTIONS.TRANSFERT_VALIDATION),
    transfertReception: has(MODULE_ACTIONS.TRANSFERT_RECEPTION),
    livraisonGestion: has(MODULE_ACTIONS.LIVRAISON_GESTION),
    depenseCreation: has(MODULE_ACTIONS.DEPENSE_CREATION),
    depenseValidation: has(MODULE_ACTIONS.DEPENSE_VALIDATION_SEUIL),
    promotionCreation: has(MODULE_ACTIONS.PROMOTION_CREATION),
    promotionValidation: has(MODULE_ACTIONS.PROMOTION_VALIDATION),
    caisseGestion: has(MODULE_ACTIONS.CAISSE_OUVERTURE, MODULE_ACTIONS.CAISSE_MOUVEMENT),
    dashboard: has(MODULE_ACTIONS.DASHBOARD_BOUTIQUE),
    comptabilite: has(MODULE_ACTIONS.COMPTABILITE_BOUTIQUE, MODULE_ACTIONS.COMPTABILITE_RESEAU),
    produitGestion: has(MODULE_ACTIONS.PRODUIT_GESTION),
    fournisseurGestion: has(MODULE_ACTIONS.FOURNISSEUR_GESTION),
    reseau: has(MODULE_ACTIONS.BOUTIQUE_GESTION),
    utilisateurs: has(MODULE_ACTIONS.UTILISATEURS_GESTION),
    securite: has(MODULE_ACTIONS.SECURITE_GESTION),
    referentiels: has(MODULE_ACTIONS.REFERENTIELS_GESTION),
    remiseValidation: has(MODULE_ACTIONS.REMISE_VALIDATION),
    etablissementGestion: has(MODULE_ACTIONS.ETABLISSEMENT_GESTION),
    beneficiaireGestion: has(MODULE_ACTIONS.BENEFICIAIRE_GESTION),
    baremeCreditBeneficiaireGestion: has(MODULE_ACTIONS.BAREME_CREDIT_BENEFICIAIRE_GESTION),
  }
}
