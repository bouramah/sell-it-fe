import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import ConfirmDialog from '../components/ConfirmDialog'
import GeoPicker from '../components/GeoPicker'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import SearchableSelect from '../components/SearchableSelect'
import SearchInput from '../components/SearchInput'
import { usePagination } from '../lib/usePagination'
import { usePermissions } from '../lib/permissions'
import { useSearch } from '../lib/useSearch'
import { useSecteurs } from '../lib/useSecteurs'
import type { Fournisseur } from '../types'
import type { FournisseurInput } from '../types/write'

const EMPTY_FORM: FournisseurInput = { nom: '', secteur: '', conditions_paiement: '', contact: '', secteur_geo_id: null }

export default function Fournisseurs() {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [editing, setEditing] = useState<Fournisseur | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<FournisseurInput>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Fournisseur | null>(null)
  const { secteurs, nomSecteur } = useSecteurs()
  const { fournisseurGestion: canGererFournisseur } = usePermissions()

  function refresh() {
    api.fournisseurs().then(setFournisseurs)
  }

  useEffect(refresh, [])

  const getFields = useCallback((f: Fournisseur) => [f.nom, f.contact, f.conditions_paiement], [])
  const { query, setQuery, filtered } = useSearch(fournisseurs, getFields)
  const { page, setPage, pageCount, paginated, totalItems, pageSize } = usePagination(filtered)

  function openCreate() {
    setForm(EMPTY_FORM)
    setError(null)
    setCreating(true)
  }

  function openEdit(f: Fournisseur) {
    setForm({ nom: f.nom, secteur: f.secteur, conditions_paiement: f.conditions_paiement, contact: f.contact, secteur_geo_id: f.secteur_geo_id })
    setError(null)
    setEditing(f)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (editing) {
        await api.modifierFournisseur(editing.id, form)
      } else {
        await api.creerFournisseur(form)
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

  async function handleDelete(f: Fournisseur) {
    await api.supprimerFournisseur(f.id)
    setConfirmDelete(null)
    refresh()
  }

  const showModal = creating || editing !== null

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fournisseurs</h1>
          <p className="text-sm text-slate-500">Fiches fournisseurs et conditions commerciales</p>
        </div>
        {canGererFournisseur && (
          <button onClick={openCreate} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
            + Ajouter un fournisseur
          </button>
        )}
      </div>

      <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un fournisseur…" />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Fournisseur</th>
              <th className="px-4 py-3">Secteur fourni</th>
              <th className="px-4 py-3">Conditions de paiement</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.map((f) => (
              <tr key={f.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{f.nom}</td>
                <td className="px-4 py-3">
                  <Badge>{nomSecteur(f.secteur)}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-600">{f.conditions_paiement}</td>
                <td className="px-4 py-3 text-slate-600">{f.contact}</td>
                <td className="px-4 py-3">
                  {canGererFournisseur && (
                    <div className="flex gap-3">
                      <button onClick={() => openEdit(f)} className="font-medium text-teal-700 hover:underline">
                        Modifier
                      </button>
                      <button onClick={() => setConfirmDelete(f)} className="font-medium text-red-600 hover:underline">
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
                  Aucun fournisseur.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination page={page} pageCount={pageCount} onChange={setPage} totalItems={totalItems} pageSize={pageSize} />
      </div>

      {showModal && (
        <Modal title={editing ? 'Modifier le fournisseur' : 'Ajouter un fournisseur'} onClose={() => { setCreating(false); setEditing(null) }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nom</label>
              <input
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Secteur fourni</label>
              <SearchableSelect
                value={form.secteur}
                onChange={(v) => setForm({ ...form, secteur: v })}
                options={secteurs.map((s) => ({ value: s.id, label: s.nom }))}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Conditions de paiement</label>
              <input
                value={form.conditions_paiement}
                onChange={(e) => setForm({ ...form, conditions_paiement: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Ex : 30 jours net"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Contact</label>
              <input
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <GeoPicker
              value={form.secteur_geo_id ?? null}
              onChange={(id) => setForm({ ...form, secteur_geo_id: id })}
              label="Localisation (facultatif)"
            />
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
          title="Supprimer le fournisseur"
          message={`Supprimer le fournisseur "${confirmDelete.nom}" ? Cette action est irréversible.`}
          confirmLabel="Supprimer"
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
