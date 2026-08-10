import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import SearchableSelect from '../components/SearchableSelect'
import SearchInput from '../components/SearchInput'
import { formatGNF, formatShortDate } from '../lib/format'
import { useBoutiques } from '../lib/useBoutiques'
import { useSearch } from '../lib/useSearch'
import { STATUT_VALIDATION_DEPENSE_LABELS, type Depense, type ReferentielItem, type StatutValidationDepense } from '../types'
import type { DepenseInput } from '../types/write'
import { useAuth } from '../lib/AuthContext'

const STATUT_TONE: Record<StatutValidationDepense, 'success' | 'warning'> = {
  auto_validee: 'success',
  en_attente: 'warning',
  validee_siege: 'success',
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function emptyForm(auteur: string): DepenseInput {
  return { boutique_id: '', categorie: '', auteur, date: todayIso(), montant: 0, justificatif_disponible: false }
}

export default function Depenses() {
  const { user } = useAuth()
  const [depenses, setDepenses] = useState<Depense[]>([])
  const [boutiqueId, setBoutiqueId] = useState('')
  const { boutiques, nomBoutique } = useBoutiques()
  const [categories, setCategories] = useState<ReferentielItem[]>([])

  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<DepenseInput>(emptyForm(''))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [validatingId, setValidatingId] = useState<string | null>(null)

  function refresh() {
    api.depenses().then(setDepenses)
  }

  useEffect(refresh, [])
  useEffect(() => {
    api.referentiels().then((r) => setCategories(r.categories_depenses ?? []))
  }, [])

  const preFiltrees = boutiqueId ? depenses.filter((d) => d.boutique_id === boutiqueId) : depenses
  const getFields = useCallback((d: Depense) => [d.categorie, d.auteur], [])
  const { query, setQuery, filtered } = useSearch(preFiltrees, getFields)

  function openCreate() {
    setForm(emptyForm(user ? `${user.prenom} ${user.nom}` : ''))
    setError(null)
    setCreating(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (form.montant <= 0) {
      setError('Le montant doit être positif.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await api.creerDepense(form)
      setCreating(false)
      refresh()
    } catch {
      setError("Échec de l'enregistrement de la dépense.")
    } finally {
      setSaving(false)
    }
  }

  async function handleValider(d: Depense) {
    setValidatingId(d.id)
    try {
      await api.validerDepense(d.id)
      refresh()
    } finally {
      setValidatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dépenses</h1>
          <p className="text-sm text-slate-500">Dépenses de boutique et circuit de validation</p>
        </div>
        <button onClick={openCreate} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
          + Enregistrer une dépense
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Rechercher une dépense…" />
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
              <th className="px-4 py-3">Boutique</th>
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3">Auteur</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Montant</th>
              <th className="px-4 py-3">Validation</th>
              <th className="px-4 py-3">Justificatif</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-600">{nomBoutique(d.boutique_id)}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{d.categorie}</td>
                <td className="px-4 py-3 text-slate-600">{d.auteur}</td>
                <td className="px-4 py-3 text-slate-500">{formatShortDate(d.date)}</td>
                <td className="px-4 py-3 text-right text-slate-900">{formatGNF(d.montant)}</td>
                <td className="px-4 py-3">
                  <Badge tone={STATUT_TONE[d.statut_validation]}>{STATUT_VALIDATION_DEPENSE_LABELS[d.statut_validation]}</Badge>
                  {d.statut_validation === 'en_attente' && (
                    <button
                      onClick={() => handleValider(d)}
                      disabled={validatingId === d.id}
                      className="ml-2 text-xs font-medium text-teal-700 hover:underline disabled:opacity-50"
                    >
                      {validatingId === d.id ? 'Validation…' : 'Valider'}
                    </button>
                  )}
                </td>
                <td className="px-4 py-3">
                  {d.justificatif_disponible ? (
                    <span className="text-teal-700 font-medium">Voir justificatif</span>
                  ) : (
                    <span className="text-slate-400">Aucun justificatif</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-400">
                  Aucune dépense.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {creating && (
        <Modal title="Enregistrer une dépense" onClose={() => setCreating(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Boutique</label>
              <SearchableSelect
                value={form.boutique_id}
                onChange={(v) => setForm({ ...form, boutique_id: v })}
                options={boutiques.map((b) => ({ value: b.id, label: b.nom }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Catégorie</label>
                <SearchableSelect
                  value={form.categorie}
                  onChange={(v) => setForm({ ...form, categorie: v })}
                  options={categories.map((c) => ({ value: c.nom, label: c.nom }))}
                  required
                />
                <p className="mt-1 text-xs text-slate-400">Gérées dans Paramètres → Référentiels</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Montant</label>
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Auteur</label>
                <input
                  value={form.auteur}
                  onChange={(e) => setForm({ ...form, auteur: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.justificatif_disponible ?? false}
                onChange={(e) => setForm({ ...form, justificatif_disponible: e.target.checked })}
                className="rounded border-slate-300"
              />
              Justificatif disponible
            </label>
            <p className="text-xs text-slate-400">
              Au-delà de 500 000 GNF, la dépense passera automatiquement « en attente » de validation par le siège.
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setCreating(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Annuler
              </button>
              <button type="submit" disabled={saving} className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
