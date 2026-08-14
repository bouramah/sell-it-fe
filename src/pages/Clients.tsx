import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import ConfirmDialog from '../components/ConfirmDialog'
import GeoPicker, { type GeoResolved } from '../components/GeoPicker'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import SearchableSelect from '../components/SearchableSelect'
import SearchInput from '../components/SearchInput'
import { formatGNF } from '../lib/format'
import { useBoutiques } from '../lib/useBoutiques'
import { usePagination } from '../lib/usePagination'
import { usePermissions } from '../lib/permissions'
import { useSearch } from '../lib/useSearch'
import { SEGMENT_LABELS, type Client, type SegmentClient } from '../types'
import type { ClientInput } from '../types/write'

const SEGMENT_TONE: Record<SegmentClient, 'default' | 'success' | 'warning' | 'danger'> = {
  nouveau: 'default',
  regulier: 'default',
  fidele: 'success',
  a_risque: 'danger',
}

const SEGMENTS: SegmentClient[] = ['nouveau', 'regulier', 'fidele', 'a_risque']

const EMPTY_FORM: ClientInput = {
  nom: '',
  contact: '',
  boutique_ids: [],
  segment: 'nouveau',
  credit_autorise: false,
  quartier: '',
  commune: '',
  ville: '',
  secteur_geo_id: null,
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const [boutiqueId, setBoutiqueId] = useState('')
  const { boutiques, nomBoutique } = useBoutiques()
  const { client: canGererClient } = usePermissions()

  const [editing, setEditing] = useState<Client | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<ClientInput>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [geoResolved, setGeoResolved] = useState<GeoResolved | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Client | null>(null)

  function refresh() {
    api.clients(boutiqueId || undefined).then(setClients)
  }

  useEffect(refresh, [boutiqueId])

  const getFields = useCallback((c: Client) => [c.nom, c.contact], [])
  const { query, setQuery, filtered } = useSearch(clients, getFields)
  const { page, setPage, pageCount, paginated, totalItems, pageSize } = usePagination(filtered)

  function openCreate() {
    setForm(EMPTY_FORM)
    setGeoResolved(null)
    setError(null)
    setCreating(true)
  }

  function openEdit(c: Client) {
    setForm({
      nom: c.nom,
      contact: c.contact,
      boutique_ids: c.boutique_ids,
      segment: c.segment,
      credit_autorise: c.credit_autorise,
      quartier: c.quartier ?? '',
      commune: c.commune ?? '',
      ville: c.ville ?? '',
      secteur_geo_id: c.secteur_geo_id,
    })
    setGeoResolved(null)
    setError(null)
    setEditing(c)
  }

  function toggleBoutique(id: string) {
    setForm((f) => ({
      ...f,
      boutique_ids: f.boutique_ids.includes(id) ? f.boutique_ids.filter((x) => x !== id) : [...f.boutique_ids, id],
    }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (form.boutique_ids.length === 0) {
      setError('Sélectionnez au moins une boutique fréquentée.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload: ClientInput = {
        ...form,
        quartier: geoResolved?.quartierNom ?? form.quartier,
        commune: geoResolved?.communeNom ?? form.commune,
        ville: geoResolved?.villeNom ?? form.ville,
      }
      if (editing) {
        await api.modifierClient(editing.id, payload)
      } else {
        await api.creerClient(payload)
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

  async function handleDelete(c: Client) {
    await api.supprimerClient(c.id)
    setConfirmDelete(null)
    refresh()
  }

  const showModal = creating || editing !== null

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-sm text-slate-500">Fiche client, historique et droit de crédit</p>
        </div>
        {canGererClient && (
          <button onClick={openCreate} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
            + Ajouter un client
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un client…" />
        <div className="w-56">
          <SearchableSelect
            value={boutiqueId}
            onChange={setBoutiqueId}
            options={boutiques.map((b) => ({ value: b.id, label: b.nom }))}
            allowEmpty="Toutes les boutiques"
            placeholder="Toutes les boutiques"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Boutique fréquentée</th>
              <th className="px-4 py-3">Localisation</th>
              <th className="px-4 py-3">Segment</th>
              <th className="px-4 py-3">Crédit autorisé</th>
              <th className="px-4 py-3 text-right">Solde dette</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{c.nom}</td>
                <td className="px-4 py-3 text-slate-600">{c.contact}</td>
                <td className="px-4 py-3 text-slate-600">{c.boutique_ids.map((id) => nomBoutique(id)).join(', ')}</td>
                <td className="px-4 py-3 text-slate-600">
                  {c.quartier || c.commune || c.ville
                    ? [c.quartier, c.commune, c.ville].filter(Boolean).join(', ')
                    : <span className="text-slate-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={SEGMENT_TONE[c.segment]}>{SEGMENT_LABELS[c.segment]}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={c.credit_autorise ? 'success' : 'default'}>{c.credit_autorise ? 'Oui' : 'Non'}</Badge>
                </td>
                <td className="px-4 py-3 text-right text-slate-900">{formatGNF(c.solde_dette)}</td>
                <td className="px-4 py-3">
                  {canGererClient && (
                    <div className="flex gap-3">
                      <button onClick={() => openEdit(c)} className="font-medium text-teal-700 hover:underline">
                        Modifier
                      </button>
                      <button onClick={() => setConfirmDelete(c)} className="font-medium text-red-600 hover:underline">
                        Suppr.
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-400">
                  Aucun client.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination page={page} pageCount={pageCount} onChange={setPage} totalItems={totalItems} pageSize={pageSize} />
      </div>

      {showModal && (
        <Modal title={editing ? 'Modifier le client' : 'Ajouter un client'} onClose={() => { setCreating(false); setEditing(null) }}>
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
              <label className="mb-1 block text-sm font-medium text-slate-700">Contact</label>
              <input
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Boutique(s) fréquentée(s)</label>
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
            <GeoPicker
              value={form.secteur_geo_id ?? null}
              onChange={(id, resolved) => {
                setForm({ ...form, secteur_geo_id: id })
                setGeoResolved(resolved ?? null)
              }}
              label="Localisation (facultatif)"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Segment</label>
                <SearchableSelect
                  value={form.segment}
                  onChange={(v) => setForm({ ...form, segment: v as SegmentClient })}
                  options={SEGMENTS.map((s) => ({ value: s, label: SEGMENT_LABELS[s] }))}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Crédit autorisé</label>
                <SearchableSelect
                  value={form.credit_autorise ? 'oui' : 'non'}
                  onChange={(v) => setForm({ ...form, credit_autorise: v === 'oui' })}
                  options={[
                    { value: 'non', label: 'Non' },
                    { value: 'oui', label: 'Oui' },
                  ]}
                  required
                />
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
          title="Supprimer le client"
          message={`Supprimer le client "${confirmDelete.nom}" ? Cette action est irréversible.`}
          confirmLabel="Supprimer"
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
