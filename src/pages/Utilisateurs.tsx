import { useEffect, useState } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import { formatDate } from '../lib/format'
import { ROLE_LABELS, type DroitAcces, type PermissionLigne, type Role, type Utilisateur } from '../types'

const DROIT_LABELS: Record<DroitAcces, string> = {
  complet: '✔',
  lecture_seule: '✔ (lecture)',
  partiel: '✔ (partiel)',
  aucun: '—',
}

const DROIT_TONE: Record<DroitAcces, 'success' | 'default' | 'warning'> = {
  complet: 'success',
  lecture_seule: 'default',
  partiel: 'warning',
  aucun: 'default',
}

const ROLES: Role[] = ['vendeur', 'caissier', 'gerant', 'responsable_achats', 'administrateur']

export default function Utilisateurs() {
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([])
  const [permissions, setPermissions] = useState<PermissionLigne[]>([])

  useEffect(() => {
    api.utilisateurs().then(setUtilisateurs)
    api.permissions().then(setPermissions)
  }, [])

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Utilisateurs & droits</h1>
        <p className="text-sm text-slate-500">{utilisateurs.length} comptes actifs sur le réseau</p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Utilisateurs</h2>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Rôle</th>
                <th className="px-4 py-3">Boutiques</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Dernière connexion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {utilisateurs.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {u.prenom} {u.nom}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.contact}</td>
                  <td className="px-4 py-3">
                    <Badge>{ROLE_LABELS[u.role]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.boutique_ids.length}</td>
                  <td className="px-4 py-3">
                    <Badge tone={u.statut === 'actif' ? 'success' : 'default'}>{u.statut}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(u.derniere_connexion)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-600">
          Matrice indicative des droits par rôle
        </h2>
        <p className="mb-3 text-xs text-slate-400">À affiner en atelier de cadrage (CDC §3.3)</p>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-blue-900 text-xs uppercase tracking-wide text-white">
              <tr>
                <th className="px-4 py-3">Module / Action</th>
                {ROLES.map((r) => (
                  <th key={r} className="px-4 py-3 text-center">
                    {ROLE_LABELS[r]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {permissions.map((p) => (
                <tr key={p.module_action} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">{p.module_action}</td>
                  {ROLES.map((r) => (
                    <td key={r} className="px-4 py-3 text-center">
                      <Badge tone={DROIT_TONE[p.droits[r]]}>{DROIT_LABELS[p.droits[r]]}</Badge>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
