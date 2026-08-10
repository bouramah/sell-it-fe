import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import SearchableSelect from '../components/SearchableSelect'
import SearchInput from '../components/SearchInput'
import { formatGNF, formatShortDate } from '../lib/format'
import { useBoutiques } from '../lib/useBoutiques'
import { useSearch } from '../lib/useSearch'
import {
  STATUT_COMMANDE_FOURNISSEUR_LABELS,
  type Fournisseur,
  type LigneCommandeFournisseur,
  type StatutCommandeFournisseur,
} from '../types'
import type { CommandeFournisseurInput } from '../types/write'

const STATUT_TONE: Record<StatutCommandeFournisseur, 'default' | 'success' | 'warning'> = {
  brouillon: 'warning',
  validee: 'default',
  envoyee: 'default',
  receptionnee_partielle: 'warning',
  receptionnee: 'success',
  cloturee: 'success',
}

const STATUTS: StatutCommandeFournisseur[] = [
  'brouillon',
  'validee',
  'envoyee',
  'receptionnee_partielle',
  'receptionnee',
  'cloturee',
]

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

const EMPTY_FORM: CommandeFournisseurInput = {
  fournisseur_id: '',
  boutique_id: '',
  date_attendue: todayIso(),
  montant: 0,
  statut: 'brouillon',
}

export default function CommandesFournisseurs() {
  const [commandes, setCommandes] = useState<LigneCommandeFournisseur[]>([])
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [boutiqueId, setBoutiqueId] = useState('')
  const { boutiques, nomBoutique } = useBoutiques()

  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<CommandeFournisseurInput>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function refresh() {
    api.commandesFournisseurs().then(setCommandes)
    api.fournisseurs().then(setFournisseurs)
  }

  useEffect(refresh, [])

  const nomFournisseur = useCallback((id: string) => fournisseurs.find((f) => f.id === id)?.nom ?? id, [fournisseurs])
  const preFiltrees = boutiqueId ? commandes.filter((c) => c.boutique_id === boutiqueId) : commandes
  const getFields = useCallback(
    (c: LigneCommandeFournisseur) => [c.id, nomFournisseur(c.fournisseur_id)],
    [nomFournisseur]
  )
  const { query, setQuery, filtered } = useSearch(preFiltrees, getFields)

  function openCreate() {
    setForm(EMPTY_FORM)
    setError(null)
    setCreating(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await api.creerCommandeFournisseur(form)
      setCreating(false)
      refresh()
    } catch {
      setError('Échec de la création de la commande.')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatutChange(c: LigneCommandeFournisseur, statut: StatutCommandeFournisseur) {
    await api.modifierCommandeFournisseur(c.id, statut)
    refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Commandes fournisseurs</h1>
          <p className="text-sm text-slate-500">Suivi des achats et réceptions</p>
        </div>
        <button onClick={openCreate} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
          + Nouvelle commande fournisseur
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Rechercher une commande…" />
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
              <th className="px-4 py-3">Commande</th>
              <th className="px-4 py-3">Fournisseur</th>
              <th className="px-4 py-3">Boutique destinataire</th>
              <th className="px-4 py-3">Date attendue</th>
              <th className="px-4 py-3 text-right">Montant</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">#{c.id}</td>
                <td className="px-4 py-3 text-slate-600">{nomFournisseur(c.fournisseur_id)}</td>
                <td className="px-4 py-3 text-slate-600">{nomBoutique(c.boutique_id)}</td>
                <td className="px-4 py-3 text-slate-500">{formatShortDate(c.date_attendue)}</td>
                <td className="px-4 py-3 text-right text-slate-900">{formatGNF(c.montant)}</td>
                <td className="px-4 py-3">
                  <div className="w-48">
                    <SearchableSelect
                      value={c.statut}
                      onChange={(v) => handleStatutChange(c, v as StatutCommandeFournisseur)}
                      options={STATUTS.map((s) => ({ value: s, label: STATUT_COMMANDE_FOURNISSEUR_LABELS[s] }))}
                    />
                  </div>
                  <div className="mt-1">
                    <Badge tone={STATUT_TONE[c.statut]}>{STATUT_COMMANDE_FOURNISSEUR_LABELS[c.statut]}</Badge>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-400">
                  Aucune commande.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {creating && (
        <Modal title="Nouvelle commande fournisseur" onClose={() => setCreating(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Fournisseur</label>
              <SearchableSelect
                value={form.fournisseur_id}
                onChange={(v) => setForm({ ...form, fournisseur_id: v })}
                options={fournisseurs.map((f) => ({ value: f.id, label: f.nom }))}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Boutique destinataire</label>
              <SearchableSelect
                value={form.boutique_id}
                onChange={(v) => setForm({ ...form, boutique_id: v })}
                options={boutiques.map((b) => ({ value: b.id, label: b.nom }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Date attendue</label>
                <input
                  type="date"
                  value={form.date_attendue}
                  onChange={(e) => setForm({ ...form, date_attendue: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Montant (GNF)</label>
                <input
                  type="number"
                  min={0}
                  value={form.montant}
                  onChange={(e) => setForm({ ...form, montant: Number(e.target.value) })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setCreating(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Annuler
              </button>
              <button type="submit" disabled={saving} className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
                {saving ? 'Création…' : 'Créer la commande'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
