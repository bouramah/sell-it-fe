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
import { STATUT_TRANSFERT_LABELS, type Produit, type StatutTransfert, type TransfertStock, type Utilisateur } from '../types'
import type { LigneReceptionInput, TransfertInput } from '../types/write'

const STATUT_TONE: Record<StatutTransfert, 'default' | 'warning' | 'success'> = {
  demande: 'default',
  valide: 'warning',
  en_transit: 'warning',
  recu: 'success',
}

interface LigneFormTransfert {
  key: number
  produit_id: string
  quantite: number
}

let ligneKeySeq = 0
function nouvelleLigne(): LigneFormTransfert {
  return { key: ++ligneKeySeq, produit_id: '', quantite: 1 }
}

const EMPTY_FORM = { boutique_source_id: '', boutique_destination_id: '', demandeur: '' }

interface LigneReception {
  produit_id: string
  produit_nom: string
  quantite: number
  quantite_recue: number
  motif_ecart: string
}

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
  const [form, setForm] = useState(EMPTY_FORM)
  const [lignes, setLignes] = useState<LigneFormTransfert[]>([nouvelleLigne()])
  const [demandeurManuel, setDemandeurManuel] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [receptionnant, setReceptionnant] = useState<TransfertStock | null>(null)
  const [lignesReception, setLignesReception] = useState<LigneReception[]>([])
  const [receptionError, setReceptionError] = useState<string | null>(null)
  const [receptionSaving, setReceptionSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  function refresh() {
    setLoading(true)
    api.transferts().then(setTransferts).finally(() => setLoading(false))
    api.produits().then(setProduits)
    api.utilisateurs().then(setUtilisateurs)
  }

  useEffect(refresh, [])

  const getFields = useCallback(
    (t: TransfertStock) => [...t.lignes.map((l) => l.produit_nom), nomBoutique(t.boutique_source_id), nomBoutique(t.boutique_destination_id), t.demandeur],
    [nomBoutique]
  )
  const { query, setQuery, filtered } = useSearch(transferts, getFields)
  const { page, setPage, pageCount, paginated, totalItems, pageSize } = usePagination(filtered)

  function openCreate() {
    setForm(EMPTY_FORM)
    setLignes([nouvelleLigne()])
    setDemandeurManuel(false)
    setError(null)
    setCreating(true)
  }

  function updateLigne(key: number, patch: Partial<LigneFormTransfert>) {
    setLignes((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  }

  function addLigne() {
    setLignes((ls) => [...ls, nouvelleLigne()])
  }

  function removeLigne(key: number) {
    setLignes((ls) => (ls.length > 1 ? ls.filter((l) => l.key !== key) : ls))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (form.boutique_source_id === form.boutique_destination_id) {
      setError('La boutique source et la boutique destination doivent être différentes.')
      return
    }
    if (lignes.some((l) => !l.produit_id || l.quantite <= 0)) {
      setError('Chaque produit doit être sélectionné avec une quantité positive.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload: TransfertInput = {
        ...form,
        lignes: lignes.map((l) => ({ produit_id: l.produit_id, quantite: l.quantite })),
      }
      await api.creerTransfert(payload)
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
      setLignesReception(t.lignes.map((l) => ({ produit_id: l.produit_id, produit_nom: l.produit_nom, quantite: l.quantite, quantite_recue: l.quantite, motif_ecart: '' })))
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

  function updateLigneReception(produitId: string, patch: Partial<LigneReception>) {
    setLignesReception((ls) => ls.map((l) => (l.produit_id === produitId ? { ...l, ...patch } : l)))
  }

  async function handleConfirmerReception(e: FormEvent) {
    e.preventDefault()
    if (!receptionnant) return
    for (const l of lignesReception) {
      if (l.quantite_recue < 0 || l.quantite_recue > l.quantite) {
        setReceptionError(`Quantité reçue invalide pour ${l.produit_nom} (entre 0 et ${l.quantite}).`)
        return
      }
      if (l.quantite_recue < l.quantite && !l.motif_ecart.trim()) {
        setReceptionError(`Motif obligatoire pour ${l.produit_nom} : indiquez la raison de l'écart (casse, perte…).`)
        return
      }
    }
    setReceptionSaving(true)
    setReceptionError(null)
    try {
      const lignesPayload: LigneReceptionInput[] = lignesReception.map((l) => ({
        produit_id: l.produit_id, quantite_recue: l.quantite_recue, motif_ecart: l.motif_ecart.trim() || undefined,
      }))
      await api.modifierStatutTransfert(receptionnant.id, 'recu', lignesPayload)
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
          <p className="text-sm text-slate-500">Mouvements inter-boutiques — un transfert peut regrouper plusieurs produits</p>
        </div>
        {canDemander && (
          <button onClick={openCreate} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
            + Nouveau transfert
          </button>
        )}
      </div>

      <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un transfert…" />

      {loading && transferts.length === 0 ? (
        <SpinnerBloc />
      ) : (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Produits</th>
              <th className="px-4 py-3">Boutique source</th>
              <th className="px-4 py-3">Boutique destination</th>
              <th className="px-4 py-3">Demandeur</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{t.lignes.length} produit{t.lignes.length > 1 ? 's' : ''}</div>
                  <div className="text-xs text-slate-500">
                    {t.lignes.map((l) => `${l.quantite} x ${l.produit_nom}`).join(', ')}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{nomBoutique(t.boutique_source_id)}</td>
                <td className="px-4 py-3 text-slate-600">{nomBoutique(t.boutique_destination_id)}</td>
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
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-400">
                  Aucun transfert.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination page={page} pageCount={pageCount} onChange={setPage} totalItems={totalItems} pageSize={pageSize} />
      </div>
      )}

      {creating && (
        <Modal title="Nouveau transfert de stock" onClose={() => setCreating(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">Produits à transférer</label>
                <button type="button" onClick={addLigne} className="text-xs font-medium text-teal-700 hover:underline">
                  + Ajouter un produit
                </button>
              </div>
              <div className="space-y-2">
                {lignes.map((l) => (
                  <div key={l.key} className="flex items-end gap-2 rounded-md border border-slate-200 p-2">
                    <div className="flex-1">
                      <SearchableSelect
                        value={l.produit_id}
                        onChange={(v) => updateLigne(l.key, { produit_id: v })}
                        options={produits.map((p) => ({ value: p.id, label: p.nom }))}
                        placeholder="Produit…"
                        required
                      />
                    </div>
                    <div className="w-20">
                      <input
                        type="number"
                        min={1}
                        value={l.quantite}
                        onChange={(e) => updateLigne(l.key, { quantite: Number(e.target.value) })}
                        className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
                        placeholder="Qté"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLigne(l.key)}
                      disabled={lignes.length === 1}
                      className="px-2 py-2 text-sm text-red-600 hover:underline disabled:opacity-30"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
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
        <Modal title={`Confirmer la réception — #${receptionnant.id}`} onClose={() => setReceptionnant(null)}>
          <form onSubmit={handleConfirmerReception} className="space-y-4">
            <div className="space-y-3">
              {lignesReception.map((l) => (
                <div key={l.produit_id} className="rounded-md border border-slate-200 p-3">
                  <p className="text-sm font-medium text-slate-900">{l.produit_nom}</p>
                  <p className="mb-2 text-xs text-slate-500">Quantité expédiée : {l.quantite}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">Quantité reçue</label>
                      <input
                        type="number"
                        min={0}
                        max={l.quantite}
                        value={l.quantite_recue}
                        onChange={(e) => updateLigneReception(l.produit_id, { quantite_recue: Number(e.target.value) })}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        required
                      />
                    </div>
                    {l.quantite_recue < l.quantite && (
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Motif de l'écart</label>
                        <input
                          value={l.motif_ecart}
                          onChange={(e) => updateLigneReception(l.produit_id, { motif_ecart: e.target.value })}
                          placeholder="Casse, perte…"
                          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
