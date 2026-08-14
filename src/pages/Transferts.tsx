import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import SearchableSelect from '../components/SearchableSelect'
import SearchInput from '../components/SearchInput'
import { useBoutiques } from '../lib/useBoutiques'
import { usePagination } from '../lib/usePagination'
import { usePermissions } from '../lib/permissions'
import { useSearch } from '../lib/useSearch'
import { STATUT_TRANSFERT_LABELS, type Produit, type StatutTransfert, type TransfertStock, type Utilisateur } from '../types'
import type { TransfertInput } from '../types/write'

const STATUT_TONE: Record<StatutTransfert, 'default' | 'warning' | 'success'> = {
  demande: 'default',
  valide: 'warning',
  en_transit: 'warning',
  recu: 'success',
}

const EMPTY_FORM: TransfertInput = { produit_id: '', boutique_source_id: '', boutique_destination_id: '', quantite: 1, demandeur: '' }

export default function Transferts() {
  const [transferts, setTransferts] = useState<TransfertStock[]>([])
  const [produits, setProduits] = useState<Produit[]>([])
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([])
  const { boutiques, nomBoutique } = useBoutiques()
  const { transfertDemande: canDemander, transfertValidation: canValider, transfertReception: canRecevoir } = usePermissions()
  const statutsEditables: StatutTransfert[] = [
    ...(canValider ? (['valide', 'en_transit'] as StatutTransfert[]) : []),
    ...(canRecevoir ? (['recu'] as StatutTransfert[]) : []),
  ]

  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<TransfertInput>(EMPTY_FORM)
  const [demandeurManuel, setDemandeurManuel] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [receptionnant, setReceptionnant] = useState<TransfertStock | null>(null)
  const [quantiteRecue, setQuantiteRecue] = useState(0)
  const [motifEcart, setMotifEcart] = useState('')
  const [receptionError, setReceptionError] = useState<string | null>(null)
  const [receptionSaving, setReceptionSaving] = useState(false)

  function refresh() {
    api.transferts().then(setTransferts)
    api.produits().then(setProduits)
    api.utilisateurs().then(setUtilisateurs)
  }

  useEffect(refresh, [])

  const nomProduit = useCallback((id: string) => produits.find((p) => p.id === id)?.nom ?? id, [produits])
  const getFields = useCallback(
    (t: TransfertStock) => [nomProduit(t.produit_id), nomBoutique(t.boutique_source_id), nomBoutique(t.boutique_destination_id), t.demandeur],
    [nomProduit, nomBoutique]
  )
  const { query, setQuery, filtered } = useSearch(transferts, getFields)
  const { page, setPage, pageCount, paginated, totalItems, pageSize } = usePagination(filtered)

  function openCreate() {
    setForm(EMPTY_FORM)
    setDemandeurManuel(false)
    setError(null)
    setCreating(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (form.boutique_source_id === form.boutique_destination_id) {
      setError('La boutique source et la boutique destination doivent être différentes.')
      return
    }
    if (form.quantite <= 0) {
      setError('La quantité doit être positive.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await api.creerTransfert(form)
      setCreating(false)
      refresh()
    } catch {
      setError('Échec de la création du transfert.')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatutChange(t: TransfertStock, statut: StatutTransfert) {
    if (statut === 'recu') {
      setReceptionnant(t)
      setQuantiteRecue(t.quantite)
      setMotifEcart('')
      setReceptionError(null)
      return
    }
    try {
      await api.modifierStatutTransfert(t.id, statut)
      refresh()
    } catch {
      window.alert("Échec de la mise à jour — le stock source est peut-être insuffisant pour la réception.")
      refresh()
    }
  }

  async function handleConfirmerReception(e: FormEvent) {
    e.preventDefault()
    if (!receptionnant) return
    if (quantiteRecue < 0 || quantiteRecue > receptionnant.quantite) {
      setReceptionError(`La quantité reçue doit être comprise entre 0 et ${receptionnant.quantite}.`)
      return
    }
    if (quantiteRecue < receptionnant.quantite && !motifEcart.trim()) {
      setReceptionError("Motif obligatoire : indiquez la raison de l'écart (casse, perte…).")
      return
    }
    setReceptionSaving(true)
    setReceptionError(null)
    try {
      await api.modifierStatutTransfert(receptionnant.id, 'recu', quantiteRecue, motifEcart.trim() || undefined)
      setReceptionnant(null)
      refresh()
    } catch (err) {
      setReceptionError(err instanceof Error && err.message ? err.message : "Échec de l'enregistrement.")
    } finally {
      setReceptionSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transferts de stock</h1>
          <p className="text-sm text-slate-500">Mouvements inter-boutiques</p>
        </div>
        {canDemander && (
          <button onClick={openCreate} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
            + Nouveau transfert
          </button>
        )}
      </div>

      <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un transfert…" />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Boutique source</th>
              <th className="px-4 py-3">Boutique destination</th>
              <th className="px-4 py-3 text-right">Quantité</th>
              <th className="px-4 py-3">Demandeur</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{nomProduit(t.produit_id)}</td>
                <td className="px-4 py-3 text-slate-600">{nomBoutique(t.boutique_source_id)}</td>
                <td className="px-4 py-3 text-slate-600">{nomBoutique(t.boutique_destination_id)}</td>
                <td className="px-4 py-3 text-right">{t.quantite}</td>
                <td className="px-4 py-3 text-slate-600">{t.demandeur}</td>
                <td className="px-4 py-3">
                  {statutsEditables.length > 0 && t.statut !== 'recu' ? (
                    <div className="w-40">
                      <SearchableSelect
                        value={t.statut}
                        onChange={(v) => handleStatutChange(t, v as StatutTransfert)}
                        options={[t.statut, ...statutsEditables]
                          .filter((s, i, arr) => arr.indexOf(s) === i)
                          .map((s) => ({ value: s, label: STATUT_TRANSFERT_LABELS[s] }))}
                      />
                    </div>
                  ) : (
                    <Badge tone={STATUT_TONE[t.statut]}>{STATUT_TRANSFERT_LABELS[t.statut]}</Badge>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-400">
                  Aucun transfert.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination page={page} pageCount={pageCount} onChange={setPage} totalItems={totalItems} pageSize={pageSize} />
      </div>

      {creating && (
        <Modal title="Nouveau transfert de stock" onClose={() => setCreating(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Produit</label>
              <SearchableSelect
                value={form.produit_id}
                onChange={(v) => setForm({ ...form, produit_id: v })}
                options={produits.map((p) => ({ value: p.id, label: p.nom }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Boutique source</label>
                <SearchableSelect
                  value={form.boutique_source_id}
                  onChange={(v) => setForm({ ...form, boutique_source_id: v })}
                  options={boutiques.map((b) => ({ value: b.id, label: b.nom }))}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Boutique destination</label>
                <SearchableSelect
                  value={form.boutique_destination_id}
                  onChange={(v) => setForm({ ...form, boutique_destination_id: v })}
                  options={boutiques.map((b) => ({ value: b.id, label: b.nom }))}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Quantité</label>
                <input
                  type="number"
                  min={1}
                  value={form.quantite}
                  onChange={(e) => setForm({ ...form, quantite: Number(e.target.value) })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700">Demandeur</label>
                  <button
                    type="button"
                    onClick={() => {
                      setDemandeurManuel((m) => !m)
                      setForm({ ...form, demandeur: '' })
                    }}
                    className="text-xs font-medium text-teal-700 hover:underline"
                  >
                    {demandeurManuel ? 'Liste' : 'Manuel'}
                  </button>
                </div>
                {demandeurManuel ? (
                  <input
                    value={form.demandeur}
                    onChange={(e) => setForm({ ...form, demandeur: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    required
                  />
                ) : (
                  <SearchableSelect
                    value={form.demandeur}
                    onChange={(v) => setForm({ ...form, demandeur: v })}
                    options={utilisateurs.map((u) => ({ value: `${u.prenom} ${u.nom}`, label: `${u.prenom} ${u.nom} — ${u.contact}` }))}
                    required
                  />
                )}
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setCreating(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Annuler
              </button>
              <button type="submit" disabled={saving} className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
                {saving ? 'Création…' : 'Créer le transfert'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {receptionnant && (
        <Modal title={`Confirmer la réception — ${nomProduit(receptionnant.produit_id)}`} onClose={() => setReceptionnant(null)}>
          <form onSubmit={handleConfirmerReception} className="space-y-4">
            <p className="text-sm text-slate-600">
              Quantité expédiée : <span className="font-semibold text-slate-900">{receptionnant.quantite}</span>
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Quantité réellement reçue</label>
              <input
                type="number"
                min={0}
                max={receptionnant.quantite}
                value={quantiteRecue}
                onChange={(e) => setQuantiteRecue(Number(e.target.value))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            {quantiteRecue < receptionnant.quantite && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Motif de l'écart (casse, perte en transit…)</label>
                <input
                  value={motifEcart}
                  onChange={(e) => setMotifEcart(e.target.value)}
                  placeholder="Ex : 2 unités cassées pendant le transport"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
            )}
            {receptionError && <p className="text-sm text-red-600">{receptionError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setReceptionnant(null)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Annuler
              </button>
              <button type="submit" disabled={receptionSaving} className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
                {receptionSaving ? 'Confirmation…' : 'Confirmer la réception'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
