const API_BASE = 'http://localhost:8000/api/v1'

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) {
    throw new Error(`Erreur API ${res.status} sur ${path}`)
  }
  return res.json() as Promise<T>
}

import type { Boutique, DashboardConsolide, LigneStock, PermissionLigne, Utilisateur } from '../types'

export const api = {
  boutiques: () => getJson<Boutique[]>('/boutiques'),
  boutique: (id: string) => getJson<Boutique>(`/boutiques/${id}`),
  stock: (boutiqueId?: string) => getJson<LigneStock[]>(`/stock${boutiqueId ? `?boutique_id=${boutiqueId}` : ''}`),
  utilisateurs: () => getJson<Utilisateur[]>('/utilisateurs'),
  permissions: () => getJson<PermissionLigne[]>('/permissions'),
  dashboard: () => getJson<DashboardConsolide>('/dashboard'),
}
