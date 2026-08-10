import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import SearchableSelect from '../components/SearchableSelect'
import SearchInput from '../components/SearchInput'
import { formatGNF, formatTime } from '../lib/format'
import { useBoutiques } from '../lib/useBoutiques'
import { useSearch } from '../lib/useSearch'
import { STATUT_CAISSE_LABELS, type Caisse as CaisseEntity, type LigneMouvementCaisse, type StatutCaisse, type TypeMouvementCaisse } from '../types'
import type { CaisseInput, MouvementCaisseInput } from '../types/write'

const STATUT_TONE: Record<StatutCaisse, 'success' | 'default' | 'danger'> = {
  ouverte: 'success',
  fermee: 'default',
  ecart_signale: 'danger',
}

const EMPTY_CAISSE_FORM: CaisseInput = { boutique_id: '', libelle: 'Principale', fond_initial: 0, operateur: '' }
const EMPTY_MVT_FORM: MouvementCaisseInput = { caisse_id: '', type: 'encaissement', motif: '', operateur: '', montant: 0 }

export default function Caisse() {
  const [caisses, setCaisses] = useState<CaisseEntity[]>([])
  const [mouvements, setMouvements] = useState<LigneMouvementCaisse[]>([])
  const { nomBoutique, boutiques } = useBoutiques()

  const [creatingCaisse, setCreatingCaisse] = useState(false)
  const [caisseForm, setCaisseForm] = useState<CaisseInput>(EMPTY_CAISSE_FORM)
  const [caisseError, setCaisseError] = useState<string | null>(null)
  const [savingCaisse, setSavingCaisse] = useState(false)

  const [closingCaisse, setClosingCaisse] = useState<CaisseEntity | null>(null)
  const [soldeReel, setSoldeReel] = useState(0)
  const [closingError, setClosingError] = useState<string | null>(null)
  const [closingSaving, setClosingSaving] = useState(false)

  const [creatingMvt, setCreatingMvt] = useState(false)
  const [mvtForm, setMvtForm] = useState<MouvementCaisseInput>(EMPTY_MVT_FORM)
  const [mvtError, setMvtError] = useState<string | null>(null)
  const [savingMvt, setSavingMvt] = useState(false)

  function refresh() {
    api.caisses().then(setCaisses)
    api.mouvementsCaisse().then(setMouvements)
  }

  useEffect(refresh, [])

  const getFields = useCallback(
    (m: LigneMouvementCaisse) => [nomBoutique(m.boutique_id), m.caisse_libelle, m.motif, m.operateur],
    [nomBoutique]
  )
  const { query, setQuery, filtered } = useSearch(mouvements, getFields)

  function openCreateCaisse() {
    setCaisseForm(EMPTY_CAISSE_FORM)
    setCaisseError(null)
    setCreatingCaisse(true)
  }

  async function handleSubmitCaisse(e: FormEvent) {
    e.preventDefault()
    setSavingCaisse(true)
    setCaisseError(null)
    try {
      await api.creerCaisse(caisseForm)
      setCreatingCaisse(false)
      refresh()
    } catch {
      setCaisseError("Échec de l'ouverture de caisse.")
    } finally {
      setSavingCaisse(false)
    }
  }

  function openClose(c: CaisseEntity) {
    setSoldeReel(c.solde_theorique)
    setClosingError(null)
    setClosingCaisse(c)
  }

  async function handleSubmitClose(e: FormEvent) {
    e.preventDefault()
    if (!closingCaisse) return
    setClosingSaving(true)
    setClosingError(null)
    try {
      await api.fermerCaisse(closingCaisse.id, soldeReel)
      setClosingCaisse(null)
      refresh()
    } catch {
      setClosingError('Échec de la fermeture.')
    } finally {
      setClosingSaving(false)
    }
  }

  async function handleReopen(c: CaisseEntity) {
    await api.rouvrirCaisse(c.id)
    refresh()
  }

  function openCreateMvt() {
    setMvtForm(EMPTY_MVT_FORM)
    setMvtError(null)
    setCreatingMvt(true)
  }

  async function handleSubmitMvt(e: FormEvent) {
    e.preventDefault()
    if (mvtForm.montant <= 0) {
      setMvtError('Le montant doit être positif.')
      return
    }
    setSavingMvt(true)
    setMvtError(null)
    try {
      await api.creerMouvementCaisse(mvtForm)
      setCreatingMvt(false)
      refresh()
    } catch {
      setMvtError('Échec — la caisse est peut-être fermée.')
    } finally {
      setSavingMvt(false)
    }
  }

  const caissesOuvertes = caisses.filter((c) => c.statut === 'ouverte')

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Caisse / Point de vente</h1>
          <p className="text-sm text-slate-500">État des caisses et journal des mouvements du jour</p>
        </div>
        <div className="flex gap-3">
          <button onClick={openCreateMvt} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            + Enregistrer un mouvement
          </button>
          <button onClick={openCreateCaisse} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
            + Ouvrir une caisse
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {caisses.map((c) => (
          <div key={c.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-slate-900">{c.libelle}</div>
              <Badge tone={STATUT_TONE[c.statut]}>{STATUT_CAISSE_LABELS[c.statut]}</Badge>
            </div>
            <div className="text-xs text-slate-500">{nomBoutique(c.boutique_id)} · {c.operateur}</div>
            <div className="mt-3 text-xs text-slate-500">Solde théorique</div>
            <div className="text-lg font-semibold text-slate-900">{formatGNF(c.solde_theorique)}</div>
            <div className="text-xs text-slate-500">Solde réel</div>
            <div className={`text-lg font-semibold ${c.solde_reel === c.solde_theorique ? 'text-slate-900' : 'text-red-600'}`}>
              {formatGNF(c.solde_reel)}
            </div>
            <button
              onClick={() => (c.statut === 'ouverte' ? openClose(c) : handleReopen(c))}
              className="mt-3 w-full rounded-md border border-slate-300 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {c.statut === 'ouverte' ? 'Fermer la caisse' : 'Rouvrir la caisse'}
            </button>
          </div>
        ))}
        {caisses.length === 0 && <p className="text-sm text-slate-400">Aucune caisse ouverte pour le moment.</p>}
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
          Journal des mouvements de caisse — aujourd'hui
        </h2>
        <div className="mb-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un mouvement…" />
        </div>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Heure</th>
                <th className="px-4 py-3">Boutique / Caisse</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Motif</th>
                <th className="px-4 py-3">Opérateur</th>
                <th className="px-4 py-3 text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{formatTime(m.horodatage)}</td>
                  <td className="px-4 py-3 text-slate-600">{nomBoutique(m.boutique_id)} — {m.caisse_libelle}</td>
                  <td className="px-4 py-3">
                    <Badge tone={m.type === 'encaissement' ? 'success' : 'default'}>
                      {m.type === 'encaissement' ? 'Encaissement' : 'Décaissement'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{m.motif}</td>
                  <td className="px-4 py-3 text-slate-600">{m.operateur}</td>
                  <td className={`px-4 py-3 text-right font-medium ${m.montant >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {m.montant >= 0 ? `+${formatGNF(m.montant)}` : `-${formatGNF(Math.abs(m.montant))}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {creatingCaisse && (
        <Modal title="Ouvrir une caisse" onClose={() => setCreatingCaisse(false)}>
          <form onSubmit={handleSubmitCaisse} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Boutique</label>
              <SearchableSelect
                value={caisseForm.boutique_id}
                onChange={(v) => setCaisseForm({ ...caisseForm, boutique_id: v })}
                options={boutiques.map((b) => ({ value: b.id, label: b.nom }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Libellé</label>
                <SearchableSelect
                  value={caisseForm.libelle}
                  onChange={(v) => setCaisseForm({ ...caisseForm, libelle: v })}
                  options={[{ value: 'Principale', label: 'Principale' }, { value: 'Secondaire', label: 'Secondaire' }]}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Fond de caisse initial</label>
                <input type="number" min={0} value={caisseForm.fond_initial} onChange={(e) => setCaisseForm({ ...caisseForm, fond_initial: Number(e.target.value) })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Opérateur</label>
              <input value={caisseForm.operateur} onChange={(e) => setCaisseForm({ ...caisseForm, operateur: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
            </div>
            {caisseError && <p className="text-sm text-red-600">{caisseError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setCreatingCaisse(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Annuler</button>
              <button type="submit" disabled={savingCaisse} className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">{savingCaisse ? 'Ouverture…' : 'Ouvrir'}</button>
            </div>
          </form>
        </Modal>
      )}

      {closingCaisse && (
        <Modal title={`Fermer la caisse — ${closingCaisse.libelle}`} onClose={() => setClosingCaisse(null)}>
          <form onSubmit={handleSubmitClose} className="space-y-4">
            <p className="text-sm text-slate-600">
              Solde théorique : <span className="font-semibold text-slate-900">{formatGNF(closingCaisse.solde_theorique)}</span>
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Solde réel compté</label>
              <input type="number" value={soldeReel} onChange={(e) => setSoldeReel(Number(e.target.value))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
            </div>
            {soldeReel !== closingCaisse.solde_theorique && (
              <p className="text-sm text-amber-700">
                Écart de {formatGNF(Math.abs(soldeReel - closingCaisse.solde_theorique))} — la caisse sera marquée « Écart signalé ».
              </p>
            )}
            {closingError && <p className="text-sm text-red-600">{closingError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setClosingCaisse(null)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Annuler</button>
              <button type="submit" disabled={closingSaving} className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">{closingSaving ? 'Fermeture…' : 'Fermer la caisse'}</button>
            </div>
          </form>
        </Modal>
      )}

      {creatingMvt && (
        <Modal title="Enregistrer un mouvement de caisse" onClose={() => setCreatingMvt(false)}>
          <form onSubmit={handleSubmitMvt} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Caisse (ouverte)</label>
              <SearchableSelect
                value={mvtForm.caisse_id}
                onChange={(v) => setMvtForm({ ...mvtForm, caisse_id: v })}
                options={caissesOuvertes.map((c) => ({ value: c.id, label: `${nomBoutique(c.boutique_id)} — ${c.libelle}` }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
                <SearchableSelect
                  value={mvtForm.type}
                  onChange={(v) => setMvtForm({ ...mvtForm, type: v as TypeMouvementCaisse })}
                  options={[{ value: 'encaissement', label: 'Encaissement' }, { value: 'decaissement', label: 'Décaissement' }]}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Montant</label>
                <input type="number" min={0} value={mvtForm.montant} onChange={(e) => setMvtForm({ ...mvtForm, montant: Number(e.target.value) })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Motif</label>
                <input value={mvtForm.motif} onChange={(e) => setMvtForm({ ...mvtForm, motif: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Opérateur</label>
                <input value={mvtForm.operateur} onChange={(e) => setMvtForm({ ...mvtForm, operateur: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" required />
              </div>
            </div>
            {mvtError && <p className="text-sm text-red-600">{mvtError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setCreatingMvt(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Annuler</button>
              <button type="submit" disabled={savingMvt} className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">{savingMvt ? 'Enregistrement…' : 'Enregistrer'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
