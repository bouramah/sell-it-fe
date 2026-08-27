import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import ConfirmDialog from '../components/ConfirmDialog'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import SearchInput from '../components/SearchInput'
import { usePagination } from '../lib/usePagination'
import { usePermissions } from '../lib/permissions'
import { useSearch } from '../lib/useSearch'
import type { Ecole } from '../types'
import type { EcoleInput } from '../types/write'

const EMPTY_FORM: EcoleInput = { nom: '', adresse: '', referent_nom: '', referent_contact: '', comptabilite_nom: '', comptabilite_contact: '' }

export default function Ecoles() {
  const [ecoles, setEcoles] = useState<Ecole[]>([])
  const [editing, setEditing] = useState<Ecole | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<EcoleInput>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Ecole | null>(null)
  const { ecoleGestion: canGerer } = usePermissions()

  function refresh() {
    api.ecoles().then(setEcoles)
  }

  useEffect(refresh, [])

  const getFields = useCallback((e: Ecole) => [e.nom, e.referent_nom, e.comptabilite_nom], [])
  const { query, setQuery, filtered } = useSearch(ecoles, getFields)
  const { page, setPage, pageCount, paginated, totalItems, pageSize } = usePagination(filtered)

  function openCreate() {
    setForm(EMPTY_FORM)
    setError(null)
    setCreating(true)
  }

  function openEdit(e: Ecole) {
    setForm({
      nom: e.nom, adresse: e.adresse ?? '', referent_nom: e.referent_nom, referent_contact: e.referent_contact,
      comptabilite_nom: e.comptabilite_nom, comptabilite_contact: e.comptabilite_contact,
    })
    setError(null)
    setEditing(e)
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (editing) {
        await api.modifierEcole(editing.id, form)
      } else {
        await api.creerEcole(form)
      }
      setEditing(null)
      setCreating(false)
      refresh()
    } catch {
      setError("Échec de l'enregistrement — vérifiez les champs.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(e: Ecole) {
    await api.supprimerEcole(e.id)
    setConfirmDelete(null)
    refresh()
  }

  const showModal = creating || editing !== null

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Écoles partenaires</h1>
          <p className="text-sm text-slate-500">Aide aux Enseignants — écoles, garants (référent + comptabilité)</p>
        </div>
        {canGerer && (
          <button onClick={openCreate} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
            + Ajouter une école
          </button>
        )}
      </div>

      <SearchInput value={query} onChange={setQuery} placeholder="Rechercher une école…" />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">École</th>
              <th className="px-4 py-3">Garant référent</th>
              <th className="px-4 py-3">Garant comptabilité</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {e.nom}
                  {e.adresse && <div className="text-xs font-normal text-slate-400">{e.adresse}</div>}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {e.referent_nom}
                  <div className="text-xs text-slate-400">{e.referent_contact}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {e.comptabilite_nom}
                  <div className="text-xs text-slate-400">{e.comptabilite_contact}</div>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={e.statut === 'active' ? 'success' : 'default'}>{e.statut === 'active' ? 'Active' : 'Inactive'}</Badge>
                </td>
                <td className="px-4 py-3">
                  {canGerer && (
                    <div className="flex gap-3">
                      <button onClick={() => openEdit(e)} className="font-medium text-teal-700 hover:underline">
                        Modifier
                      </button>
                      <button onClick={() => setConfirmDelete(e)} className="font-medium text-red-600 hover:underline">
                        Suppr.
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-400">
                  Aucune école.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination page={page} pageCount={pageCount} onChange={setPage} totalItems={totalItems} pageSize={pageSize} />
      </div>

      {showModal && (
        <Modal title={editing ? "Modifier l'école" : 'Ajouter une école'} onClose={() => { setCreating(false); setEditing(null) }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nom de l'école</label>
              <input
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Adresse (facultatif)</label>
              <input
                value={form.adresse ?? ''}
                onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="rounded-md border border-slate-200 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Garant référent (enseignant)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Nom</label>
                  <input
                    value={form.referent_nom}
                    onChange={(e) => setForm({ ...form, referent_nom: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Contact (SMS)</label>
                  <input
                    value={form.referent_contact}
                    onChange={(e) => setForm({ ...form, referent_contact: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    placeholder="620 00 00 00"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="rounded-md border border-slate-200 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Garant comptabilité (école)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Nom</label>
                  <input
                    value={form.comptabilite_nom}
                    onChange={(e) => setForm({ ...form, comptabilite_nom: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Contact (SMS)</label>
                  <input
                    value={form.comptabilite_contact}
                    onChange={(e) => setForm({ ...form, comptabilite_contact: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    placeholder="620 00 00 00"
                    required
                  />
                </div>
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setCreating(false); setEditing(null) }} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Annuler
              </button>
              <button type="submit" disabled={saving} className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
                {saving ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Ajouter'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Supprimer l'école"
          message={`Supprimer "${confirmDelete.nom}" ? Cette action est irréversible.`}
          confirmLabel="Supprimer"
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
