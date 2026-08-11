import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import ConfirmDialog from '../components/ConfirmDialog'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import SearchableSelect from '../components/SearchableSelect'
import SearchInput from '../components/SearchInput'
import { formatDate } from '../lib/format'
import { usePagination } from '../lib/usePagination'
import { useSearch } from '../lib/useSearch'
import { ROLE_LABELS, type Boutique, type DroitAcces, type PermissionLigne, type Role, type Utilisateur } from '../types'
import type { UtilisateurInput } from '../types/write'

const DROIT_LABELS: Record<DroitAcces, string> = {
  complet: '✔',
  lecture_seule: '✔ (lecture)',
  partiel: '✔ (partiel)',
  aucun: '—',
}

const DROIT_SELECT_TONE: Record<DroitAcces, string> = {
  complet: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  lecture_seule: 'border-slate-200 bg-slate-50 text-slate-700',
  partiel: 'border-amber-200 bg-amber-50 text-amber-800',
  aucun: 'border-slate-200 bg-slate-50 text-slate-400',
}

const DROITS: DroitAcces[] = ['complet', 'lecture_seule', 'partiel', 'aucun']

const ROLES: Role[] = ['vendeur', 'caissier', 'gerant', 'responsable_achats', 'administrateur']

// Doit rester synchronisé avec DEFAULT_PASSWORD dans backend/app/core/security.py
const DEFAULT_PASSWORD = 'kfstore2026'

const EMPTY_FORM: UtilisateurInput = {
  nom: '',
  prenom: '',
  contact: '',
  mot_de_passe: DEFAULT_PASSWORD,
  role: 'vendeur',
  boutique_ids: [],
  statut: 'actif',
}

export default function Utilisateurs() {
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([])
  const [permissions, setPermissions] = useState<PermissionLigne[]>([])
  const [boutiques, setBoutiques] = useState<Boutique[]>([])
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Utilisateur | null>(null)
  const [form, setForm] = useState<UtilisateurInput>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Utilisateur | null>(null)
  const [savingCell, setSavingCell] = useState<string | null>(null)

  function refresh() {
    api.utilisateurs().then(setUtilisateurs)
  }

  useEffect(() => {
    refresh()
    api.permissions().then(setPermissions)
    api.boutiques().then(setBoutiques)
  }, [])

  function rattachement(u: Utilisateur): string {
    if (u.boutique_ids.length === boutiques.length && boutiques.length > 0) return 'Toutes boutiques'
    const names = u.boutique_ids.map((id) => boutiques.find((b) => b.id === id)?.nom).filter(Boolean)
    return names.join(', ') || '—'
  }

  const getUserFields = useCallback(
    (u: Utilisateur) => [u.nom, u.prenom, u.contact, ROLE_LABELS[u.role], rattachement(u)],
    [boutiques]
  )
  const { query, setQuery, filtered } = useSearch(utilisateurs, getUserFields)
  const { page, setPage, pageCount, paginated, totalItems, pageSize } = usePagination(filtered)

  const getPermFields = useCallback((p: PermissionLigne) => [p.module_action], [])
  const { query: permQuery, setQuery: setPermQuery, filtered: filteredPermissions } = useSearch(permissions, getPermFields)

  async function handlePermissionChange(moduleAction: string, role: Role, droit: DroitAcces) {
    const cellKey = `${moduleAction}::${role}`
    setSavingCell(cellKey)
    try {
      const updated = await api.modifierPermission({ module_action: moduleAction, role, droit })
      setPermissions((prev) => prev.map((p) => (p.module_action === moduleAction ? updated : p)))
    } finally {
      setSavingCell(null)
    }
  }

  function openCreate() {
    setForm(EMPTY_FORM)
    setError(null)
    setCreating(true)
  }

  function openEdit(u: Utilisateur) {
    setForm({
      nom: u.nom,
      prenom: u.prenom,
      contact: u.contact,
      mot_de_passe: '',
      role: u.role,
      boutique_ids: u.boutique_ids,
      statut: u.statut,
    })
    setError(null)
    setEditing(u)
  }

  function toggleBoutique(id: string) {
    setForm((f) => ({
      ...f,
      boutique_ids: f.boutique_ids.includes(id) ? f.boutique_ids.filter((x) => x !== id) : [...f.boutique_ids, id],
    }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!editing && !form.mot_de_passe) {
      setError('Le mot de passe est requis pour un nouvel utilisateur.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (editing) {
        const payload: Partial<UtilisateurInput> = { ...form }
        if (!payload.mot_de_passe) delete payload.mot_de_passe
        await api.modifierUtilisateur(editing.id, payload)
      } else {
        await api.creerUtilisateur(form)
      }
      setCreating(false)
      setEditing(null)
      refresh()
    } catch {
      setError('Échec de l\'enregistrement — le contact est peut-être déjà utilisé.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(u: Utilisateur) {
    await api.supprimerUtilisateur(u.id)
    setConfirmDelete(null)
    refresh()
  }

  const showModal = creating || editing !== null

  return (
    <div className="space-y-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Utilisateurs & droits</h1>
          <p className="text-sm text-slate-500">Comptes, rôles et matrice de permissions</p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800"
        >
          + Ajouter un utilisateur
        </button>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Utilisateurs</h2>
        <div className="mb-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un utilisateur…" />
        </div>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Rôle</th>
                <th className="px-4 py-3">Boutique(s) de rattachement</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Dernière connexion</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {u.prenom} {u.nom}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.contact}</td>
                  <td className="px-4 py-3">
                    <Badge>{ROLE_LABELS[u.role]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{rattachement(u)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={u.statut === 'actif' ? 'success' : 'default'}>{u.statut}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(u.derniere_connexion)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => openEdit(u)} className="font-medium text-teal-700 hover:underline">
                        Modifier
                      </button>
                      <button onClick={() => setConfirmDelete(u)} className="font-medium text-red-600 hover:underline">
                        Suppr.
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-400">
                    Aucun utilisateur ne correspond à la recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination page={page} pageCount={pageCount} onChange={setPage} totalItems={totalItems} pageSize={pageSize} />
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-600">
          Matrice des droits par rôle
        </h2>
        <p className="mb-3 text-xs text-slate-400">Permissions granulaires par module et par action — modifiable sans développement</p>
        <div className="mb-3">
          <SearchInput value={permQuery} onChange={setPermQuery} placeholder="Rechercher un module/action…" />
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-teal-800 text-xs uppercase tracking-wide text-white">
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
              {filteredPermissions.map((p) => (
                <tr key={p.module_action} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">{p.module_action}</td>
                  {ROLES.map((r) => {
                    const cellKey = `${p.module_action}::${r}`
                    return (
                      <td key={r} className="px-4 py-3 text-center">
                        <select
                          value={p.droits[r]}
                          disabled={savingCell === cellKey}
                          onChange={(e) => handlePermissionChange(p.module_action, r, e.target.value as DroitAcces)}
                          className={`rounded-md border px-2 py-1 text-xs font-medium disabled:opacity-50 ${DROIT_SELECT_TONE[p.droits[r]]}`}
                        >
                          {DROITS.map((d) => (
                            <option key={d} value={d}>
                              {DROIT_LABELS[d]}
                            </option>
                          ))}
                        </select>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showModal && (
        <Modal
          title={editing ? `Modifier ${editing.prenom} ${editing.nom}` : 'Ajouter un utilisateur'}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Prénom</label>
                <input
                  value={form.prenom}
                  onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nom</label>
                <input
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Contact (téléphone)</label>
                <input
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Mot de passe{' '}
                  {editing ? (
                    <span className="text-slate-400">(laisser vide pour ne pas changer)</span>
                  ) : (
                    <span className="text-slate-400">(valeur par défaut, modifiable)</span>
                  )}
                </label>
                <input
                  type="text"
                  value={form.mot_de_passe}
                  onChange={(e) => setForm({ ...form, mot_de_passe: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Rôle</label>
                <SearchableSelect
                  value={form.role}
                  onChange={(v) => setForm({ ...form, role: v as Role })}
                  options={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Statut</label>
                <SearchableSelect
                  value={form.statut}
                  onChange={(v) => setForm({ ...form, statut: v })}
                  options={[
                    { value: 'actif', label: 'Actif' },
                    { value: 'inactif', label: 'Inactif' },
                  ]}
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Boutique(s) de rattachement</label>
              <div className="flex flex-wrap gap-3">
                {boutiques.map((b) => (
                  <label key={b.id} className="flex items-center gap-1.5 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.boutique_ids.includes(b.id)}
                      onChange={() => toggleBoutique(b.id)}
                    />
                    {b.nom}
                  </label>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCreating(false)
                  setEditing(null)
                }}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
              >
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Supprimer l'utilisateur"
          message={`Supprimer l'utilisateur "${confirmDelete.prenom} ${confirmDelete.nom}" ? Cette action est irréversible.`}
          confirmLabel="Supprimer"
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
