import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import SearchableSelect from '../components/SearchableSelect'
import SearchInput from '../components/SearchInput'
import { formatGNF } from '../lib/format'
import { useBoutiques } from '../lib/useBoutiques'
import { useSearch } from '../lib/useSearch'
import { SEGMENT_LABELS, type Client, type ReferentielItem, type SegmentClient } from '../types'
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
  boutique_id: '',
  segment: 'nouveau',
  credit_autorise: false,
  quartier: '',
  commune: '',
  ville: '',
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const { boutiques, nomBoutique } = useBoutiques()

  const [editing, setEditing] = useState<Client | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<ClientInput>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [villesRef, setVillesRef] = useState<ReferentielItem[]>([])
  const [communesRef, setCommunesRef] = useState<ReferentielItem[]>([])
  const [quartiersRef, setQuartiersRef] = useState<ReferentielItem[]>([])

  function refresh() {
    api.clients().then(setClients)
  }

  useEffect(refresh, [])

  useEffect(() => {
    api.referentiels().then((r) => {
      setVillesRef(r.villes ?? [])
      setCommunesRef(r.communes ?? [])
      setQuartiersRef(r.quartiers ?? [])
    })
  }, [])

  const getFields = useCallback((c: Client) => [c.nom, c.contact], [])
  const { query, setQuery, filtered } = useSearch(clients, getFields)

  function openCreate() {
    setForm(EMPTY_FORM)
    setError(null)
    setCreating(true)
  }

  function openEdit(c: Client) {
    setForm({
      nom: c.nom,
      contact: c.contact,
      boutique_id: c.boutique_id,
      segment: c.segment,
      credit_autorise: c.credit_autorise,
      quartier: c.quartier ?? '',
      commune: c.commune ?? '',
      ville: c.ville ?? '',
    })
    setError(null)
    setEditing(c)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (editing) {
        await api.modifierClient(editing.id, form)
      } else {
        await api.creerClient(form)
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
    if (!confirm(`Supprimer le client "${c.nom}" ?`)) return
    await api.supprimerClient(c.id)
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
        <button onClick={openCreate} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
          + Ajouter un client
        </button>
      </div>

      <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un client…" />

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
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{c.nom}</td>
                <td className="px-4 py-3 text-slate-600">{c.contact}</td>
                <td className="px-4 py-3 text-slate-600">{nomBoutique(c.boutique_id)}</td>
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
                  <div className="flex gap-3">
                    <button onClick={() => openEdit(c)} className="font-medium text-teal-700 hover:underline">
                      Modifier
                    </button>
                    <button onClick={() => handleDelete(c)} className="font-medium text-red-600 hover:underline">
                      Suppr.
                    </button>
                  </div>
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
              <label className="mb-1 block text-sm font-medium text-slate-700">Boutique fréquentée</label>
              <SearchableSelect
                value={form.boutique_id}
                onChange={(v) => setForm({ ...form, boutique_id: v })}
                options={boutiques.map((b) => ({ value: b.id, label: b.nom }))}
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Quartier</label>
                <SearchableSelect
                  value={form.quartier ?? ''}
                  onChange={(v) => setForm({ ...form, quartier: v })}
                  options={quartiersRef.map((q) => ({ value: q.nom, label: q.nom }))}
                  allowEmpty="Non renseigné"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Commune</label>
                <SearchableSelect
                  value={form.commune ?? ''}
                  onChange={(v) => setForm({ ...form, commune: v })}
                  options={communesRef.map((c) => ({ value: c.nom, label: c.nom }))}
                  allowEmpty="Non renseigné"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Ville</label>
                <SearchableSelect
                  value={form.ville ?? ''}
                  onChange={(v) => setForm({ ...form, ville: v })}
                  options={villesRef.map((v) => ({ value: v.nom, label: v.nom }))}
                  allowEmpty="Non renseigné"
                />
              </div>
            </div>
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
    </div>
  )
}
