import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import SearchableSelect from '../components/SearchableSelect'
import SearchInput from '../components/SearchInput'
import { SpinnerBloc } from '../components/Spinner'
import { useBoutiques } from '../lib/useBoutiques'
import { usePagination } from '../lib/usePagination'
import { usePermissions } from '../lib/permissions'
import { useSearch } from '../lib/useSearch'
import { useSecteurs } from '../lib/useSecteurs'
import {
  ORIGINE_PROMOTION_LABELS,
  STATUT_PROMOTION_LABELS,
  type OriginePromotion,
  type Promotion,
  type StatutPromotion,
} from '../types'
import type { PromotionInput } from '../types/write'

const STATUT_TONE: Record<StatutPromotion, 'warning' | 'success' | 'default'> = {
  en_attente_validation: 'warning',
  validee: 'default',
  active: 'success',
  terminee: 'default',
}

const ORIGINE_TONE: Record<OriginePromotion, 'default' | 'success'> = {
  ia: 'default',
  gerant: 'success',
  direction: 'success',
}

const STATUTS: StatutPromotion[] = ['en_attente_validation', 'validee', 'active', 'terminee']

const EMPTY_FORM: PromotionInput = { nom: '', boutique_id: null, secteur: null, impact_estime: '' }

export default function Promotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const { boutiques, nomBoutique } = useBoutiques()
  const { secteurs, nomSecteur } = useSecteurs()
  const { promotionCreation: canCreerPromotion, promotionValidation: canValiderPromotion } = usePermissions()

  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<PromotionInput>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  function refresh() {
    setLoading(true)
    api.promotions().then(setPromotions).finally(() => setLoading(false))
  }

  useEffect(refresh, [])

  const getFields = useCallback(
    (p: Promotion) => [p.nom, p.boutique_id ? nomBoutique(p.boutique_id) : 'Toutes boutiques'],
    [nomBoutique]
  )
  const { query, setQuery, filtered } = useSearch(promotions, getFields)
  const { page, setPage, pageCount, paginated, totalItems, pageSize } = usePagination(filtered)

  function openCreate() {
    setForm(EMPTY_FORM)
    setError(null)
    setCreating(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.nom.trim() || !form.impact_estime.trim()) {
      setError('Le nom et l\'impact estimé sont obligatoires.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await api.creerPromotion(form)
      setCreating(false)
      refresh()
    } catch {
      setError('Échec de la création de la promotion.')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatutChange(p: Promotion, statut: StatutPromotion) {
    await api.modifierStatutPromotion(p.id, statut)
    refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Promotions & tarifs</h1>
          <p className="text-sm text-slate-500">Campagnes tarifaires, humaines et suggérées par l'IA</p>
        </div>
        {canCreerPromotion && (
          <button onClick={openCreate} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
            + Nouvelle promotion
          </button>
        )}
      </div>

      <SearchInput value={query} onChange={setQuery} placeholder="Rechercher une promotion…" />

      {loading && promotions.length === 0 ? (
        <SpinnerBloc />
      ) : (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Promotion</th>
              <th className="px-4 py-3">Boutique / secteur</th>
              <th className="px-4 py-3">Origine</th>
              <th className="px-4 py-3">Impact estimé</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{p.nom}</td>
                <td className="px-4 py-3 text-slate-600">
                  {p.boutique_id ? nomBoutique(p.boutique_id) : 'Toutes boutiques'}
                  {p.secteur ? ` · ${nomSecteur(p.secteur)}` : ''}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={ORIGINE_TONE[p.origine]}>{ORIGINE_PROMOTION_LABELS[p.origine]}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-600">{p.impact_estime}</td>
                <td className="px-4 py-3">
                  {canValiderPromotion ? (
                    <div className="w-44">
                      <SearchableSelect
                        value={p.statut}
                        onChange={(v) => handleStatutChange(p, v as StatutPromotion)}
                        options={STATUTS.map((s) => ({ value: s, label: STATUT_PROMOTION_LABELS[s] }))}
                      />
                    </div>
                  ) : (
                    <Badge tone={STATUT_TONE[p.statut]}>{STATUT_PROMOTION_LABELS[p.statut]}</Badge>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-400">
                  Aucune promotion.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination page={page} pageCount={pageCount} onChange={setPage} totalItems={totalItems} pageSize={pageSize} />
      </div>
      )}

      {creating && (
        <Modal title="Nouvelle promotion" onClose={() => setCreating(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nom de la promotion</label>
              <input
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder="Ex : -15 % sur les robes wax"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Boutique</label>
                <SearchableSelect
                  value={form.boutique_id ?? ''}
                  onChange={(v) => setForm({ ...form, boutique_id: v || null })}
                  options={boutiques.map((b) => ({ value: b.id, label: b.nom }))}
                  allowEmpty="Toutes les boutiques"
                  placeholder="Toutes les boutiques"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Secteur</label>
                <SearchableSelect
                  value={form.secteur ?? ''}
                  onChange={(v) => setForm({ ...form, secteur: v || null })}
                  options={secteurs.map((s) => ({ value: s.id, label: s.nom }))}
                  allowEmpty="Tous secteurs"
                  placeholder="Tous secteurs"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Impact estimé</label>
              <input
                value={form.impact_estime}
                onChange={(e) => setForm({ ...form, impact_estime: e.target.value })}
                placeholder="Ex : Écoulement stock à rotation lente"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setCreating(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Annuler
              </button>
              <button type="submit" disabled={saving} className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
                {saving ? 'Création…' : 'Créer la promotion'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
