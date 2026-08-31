import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import SearchableSelect from '../components/SearchableSelect'
import SearchInput from '../components/SearchInput'
import { SpinnerBloc } from '../components/Spinner'
import { formatGNF, formatShortDate } from '../lib/format'
import { useBoutiques } from '../lib/useBoutiques'
import { usePagination } from '../lib/usePagination'
import { usePermissions } from '../lib/permissions'
import { useSearch } from '../lib/useSearch'
import {
  STATUT_COMMANDE_FOURNISSEUR_LABELS,
  type ArticleCommandeFournisseur,
  type Fournisseur,
  type LigneCommandeFournisseur,
  type Produit,
  type StatutCommandeFournisseur,
} from '../types'
import type { ArticleCommandeInput, CorrectionReceptionLigneInput, ReceptionLigneInput } from '../types/write'
import { useAuth } from '../lib/AuthContext'

const STATUT_TONE: Record<StatutCommandeFournisseur, 'default' | 'warning' | 'success'> = {
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

interface ArticleFormLigne {
  key: number
  produit_id: string
  quantite: number
  prix_unitaire: number
}

let ligneKeySeq = 0
function nouvelleLigne(): ArticleFormLigne {
  return { key: ++ligneKeySeq, produit_id: '', quantite: 1, prix_unitaire: 0 }
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

const EMPTY_FORM = {
  fournisseur_id: '',
  boutique_id: '',
  date_attendue: todayIso(),
}

export interface PrefillCommandeFournisseur {
  boutique_id: string
  produit_id: string
  quantite: number
}

export default function CommandesFournisseurs() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { commandeFournisseur: canGererCommande } = usePermissions()
  const [commandes, setCommandes] = useState<LigneCommandeFournisseur[]>([])
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [produits, setProduits] = useState<Produit[]>([])
  const [boutiqueId, setBoutiqueId] = useState('')
  const { boutiques, nomBoutique } = useBoutiques()

  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [lignes, setLignes] = useState<ArticleFormLigne[]>([nouvelleLigne()])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [viewing, setViewing] = useState<{ commande: LigneCommandeFournisseur; articles: ArticleCommandeFournisseur[] } | null>(null)
  const [viewLoading, setViewLoading] = useState(false)

  const [receiving, setReceiving] = useState<{ commande: LigneCommandeFournisseur; articles: ArticleCommandeFournisseur[] } | null>(null)
  const [receptionQtes, setReceptionQtes] = useState<Record<string, number>>({})
  const [receptionError, setReceptionError] = useState<string | null>(null)
  const [receptionSaving, setReceptionSaving] = useState(false)

  const [correcting, setCorrecting] = useState<{ commande: LigneCommandeFournisseur; articles: ArticleCommandeFournisseur[] } | null>(null)
  const [correctionQtes, setCorrectionQtes] = useState<Record<string, number>>({})
  const [correctionError, setCorrectionError] = useState<string | null>(null)
  const [correctionSaving, setCorrectionSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  function refresh() {
    setLoading(true)
    Promise.all([
      api.commandesFournisseurs().then(setCommandes),
      api.fournisseurs().then(setFournisseurs),
      api.produits().then(setProduits),
    ]).finally(() => setLoading(false))
  }

  useEffect(refresh, [])

  // Arrivée depuis "Prévisions de demande" avec une suggestion à concrétiser (§4.3) — pré-remplit
  // boutique/produit/quantité, le fournisseur reste à choisir (une suggestion ne sait pas
  // laquelle utiliser, un produit pouvant en avoir plusieurs). État nettoyé après lecture pour
  // ne pas rouvrir le formulaire sur un retour arrière du navigateur.
  useEffect(() => {
    const prefill = (location.state as { prefill?: PrefillCommandeFournisseur } | null)?.prefill
    if (!prefill) return
    setEditingId(null)
    setForm({ ...EMPTY_FORM, boutique_id: prefill.boutique_id })
    setLignes([{ key: ++ligneKeySeq, produit_id: prefill.produit_id, quantite: prefill.quantite, prix_unitaire: 0 }])
    setError(null)
    setCreating(true)
    navigate(location.pathname, { replace: true, state: {} })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

  const nomFournisseur = useCallback((id: string) => fournisseurs.find((f) => f.id === id)?.nom ?? id, [fournisseurs])
  const nomProduit = useCallback((id: string) => produits.find((p) => p.id === id)?.nom ?? id, [produits])
  const preFiltrees = boutiqueId ? commandes.filter((c) => c.boutique_id === boutiqueId) : commandes
  const getFields = useCallback(
    (c: LigneCommandeFournisseur) => [c.id, nomFournisseur(c.fournisseur_id)],
    [nomFournisseur]
  )
  const { query, setQuery, filtered } = useSearch(preFiltrees, getFields)
  const { page, setPage, pageCount, paginated, totalItems, pageSize } = usePagination(filtered)

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setLignes([nouvelleLigne()])
    setError(null)
    setCreating(true)
  }

  async function openEdit(c: LigneCommandeFournisseur) {
    setError(null)
    setEditingId(c.id)
    setForm({ fournisseur_id: c.fournisseur_id, boutique_id: c.boutique_id, date_attendue: c.date_attendue })
    setLignes([nouvelleLigne()])
    setCreating(true)
    const detail = await api.commandeFournisseur(c.id)
    setLignes(
      detail.articles.length > 0
        ? detail.articles.map((a) => ({ key: ++ligneKeySeq, produit_id: a.produit_id, quantite: a.quantite, prix_unitaire: a.prix_unitaire }))
        : [nouvelleLigne()]
    )
  }

  function updateLigne(key: number, patch: Partial<ArticleFormLigne>) {
    setLignes((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  }

  // Prix d'achat réel négocié avec CE fournisseur pour CE produit à la date du jour — jamais le
  // prix de détail (prix de vente au client, structurellement plus élevé que le prix d'achat).
  // Peut légitimement renvoyer null si aucun prix d'achat n'a encore été enregistré pour cette
  // paire produit/fournisseur : dans ce cas la saisie manuelle reste nécessaire.
  async function resolvePrixAchat(produitId: string, fournisseurId: string): Promise<number | null> {
    if (!produitId || !fournisseurId) return null
    const periodes = await api.prixAchat(produitId, fournisseurId)
    const aujourdhui = todayIso()
    const valide = periodes.find((p) => p.date_debut <= aujourdhui && (!p.date_fin || p.date_fin >= aujourdhui))
    return valide ? valide.prix : null
  }

  async function selectProduitForLigne(key: number, produitId: string) {
    updateLigne(key, { produit_id: produitId })
    const prix = await resolvePrixAchat(produitId, form.fournisseur_id)
    if (prix !== null) updateLigne(key, { prix_unitaire: prix })
  }

  async function selectFournisseur(fournisseurId: string) {
    setForm((f) => ({ ...f, fournisseur_id: fournisseurId }))
    for (const l of lignes) {
      if (!l.produit_id) continue
      const prix = await resolvePrixAchat(l.produit_id, fournisseurId)
      if (prix !== null) updateLigne(l.key, { prix_unitaire: prix })
    }
  }

  function addLigne() {
    setLignes((ls) => [...ls, nouvelleLigne()])
  }

  function removeLigne(key: number) {
    setLignes((ls) => (ls.length > 1 ? ls.filter((l) => l.key !== key) : ls))
  }

  const totalForm = lignes.reduce((sum, l) => sum + l.quantite * l.prix_unitaire, 0)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (lignes.some((l) => !l.produit_id || l.quantite <= 0)) {
      setError('Chaque article doit avoir un produit et une quantité positive.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const articles: ArticleCommandeInput[] = lignes.map((l) => ({ produit_id: l.produit_id, quantite: l.quantite, prix_unitaire: l.prix_unitaire }))
      if (editingId) {
        await api.modifierArticlesCommandeFournisseur(editingId, { ...form, articles })
      } else {
        await api.creerCommandeFournisseur({ ...form, statut: 'brouillon', articles })
      }
      setCreating(false)
      setEditingId(null)
      refresh()
    } catch {
      setError(editingId ? 'Échec de la modification de la commande.' : 'Échec de la création de la commande.')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatutChange(c: LigneCommandeFournisseur, statut: StatutCommandeFournisseur) {
    await api.modifierCommandeFournisseur(c.id, statut)
    refresh()
  }

  async function openView(c: LigneCommandeFournisseur) {
    setViewLoading(true)
    setViewing({ commande: c, articles: [] })
    try {
      const detail = await api.commandeFournisseur(c.id)
      setViewing({ commande: c, articles: detail.articles })
    } finally {
      setViewLoading(false)
    }
  }

  async function openReceive(c: LigneCommandeFournisseur) {
    setReceptionError(null)
    setReceiving({ commande: c, articles: [] })
    const detail = await api.commandeFournisseur(c.id)
    setReceiving({ commande: c, articles: detail.articles })
    const initial: Record<string, number> = {}
    for (const a of detail.articles) {
      const restant = a.quantite - a.quantite_recue
      if (restant > 0) initial[a.produit_id] = restant
    }
    setReceptionQtes(initial)
  }

  async function handleSubmitReception(e: FormEvent) {
    e.preventDefault()
    if (!receiving) return
    const lignes: ReceptionLigneInput[] = Object.entries(receptionQtes)
      .filter(([, qte]) => qte > 0)
      .map(([produit_id, quantite]) => ({ produit_id, quantite }))
    if (lignes.length === 0) {
      setReceptionError('Indiquez au moins une quantité reçue.')
      return
    }
    setReceptionSaving(true)
    setReceptionError(null)
    try {
      await api.receptionnerCommandeFournisseur(receiving.commande.id, { operateur: user ? `${user.prenom} ${user.nom}` : 'Opérateur', lignes })
      setReceiving(null)
      refresh()
    } catch {
      setReceptionError('Échec de la réception — vérifiez les quantités saisies.')
    } finally {
      setReceptionSaving(false)
    }
  }

  async function openCorrect(c: LigneCommandeFournisseur) {
    setCorrectionError(null)
    setCorrecting({ commande: c, articles: [] })
    const detail = await api.commandeFournisseur(c.id)
    setCorrecting({ commande: c, articles: detail.articles })
    const initial: Record<string, number> = {}
    for (const a of detail.articles) {
      initial[a.produit_id] = a.quantite_recue
    }
    setCorrectionQtes(initial)
  }

  async function handleSubmitCorrection(e: FormEvent) {
    e.preventDefault()
    if (!correcting) return
    const lignes: CorrectionReceptionLigneInput[] = correcting.articles.map((a) => ({
      produit_id: a.produit_id,
      quantite_recue: correctionQtes[a.produit_id] ?? a.quantite_recue,
    }))
    setCorrectionSaving(true)
    setCorrectionError(null)
    try {
      await api.corrigerReceptionCommandeFournisseur(correcting.commande.id, {
        operateur: user ? `${user.prenom} ${user.nom}` : 'Opérateur',
        lignes,
      })
      setCorrecting(null)
      refresh()
    } catch {
      setCorrectionError('Échec de la correction — vérifiez les quantités saisies.')
    } finally {
      setCorrectionSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Commandes fournisseurs</h1>
          <p className="text-sm text-slate-500">Suivi des achats et réceptions</p>
        </div>
        {canGererCommande && (
          <button onClick={openCreate} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
            + Nouvelle commande fournisseur
          </button>
        )}
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

      {loading && commandes.length === 0 ? (
        <SpinnerBloc />
      ) : (
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
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">#{c.id}</td>
                  <td className="px-4 py-3 text-slate-600">{nomFournisseur(c.fournisseur_id)}</td>
                  <td className="px-4 py-3 text-slate-600">{nomBoutique(c.boutique_id)}</td>
                  <td className="px-4 py-3 text-slate-500">{formatShortDate(c.date_attendue)}</td>
                  <td className="px-4 py-3 text-right text-slate-900">{formatGNF(c.montant)}</td>
                  <td className="px-4 py-3">
                    {canGererCommande ? (
                      <div className="w-48">
                        <SearchableSelect
                          value={c.statut}
                          onChange={(v) => handleStatutChange(c, v as StatutCommandeFournisseur)}
                          options={STATUTS.map((s) => ({ value: s, label: STATUT_COMMANDE_FOURNISSEUR_LABELS[s] }))}
                        />
                      </div>
                    ) : (
                      <Badge tone={STATUT_TONE[c.statut]}>{STATUT_COMMANDE_FOURNISSEUR_LABELS[c.statut]}</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1">
                      <button onClick={() => openView(c)} className="font-medium text-teal-700 hover:underline">
                        Voir
                      </button>
                      {c.statut === 'brouillon' && canGererCommande && (
                        <button onClick={() => openEdit(c)} className="font-medium text-teal-700 hover:underline">
                          Modifier
                        </button>
                      )}
                      {c.statut !== 'receptionnee' && c.statut !== 'cloturee' && canGererCommande && (
                        <button onClick={() => openReceive(c)} className="font-medium text-teal-700 hover:underline">
                          Réceptionner
                        </button>
                      )}
                      {(c.statut === 'receptionnee_partielle' || c.statut === 'receptionnee') && canGererCommande && (
                        <button onClick={() => openCorrect(c)} className="font-medium text-amber-700 hover:underline">
                          Corriger la réception
                        </button>
                      )}
                      <button onClick={() => api.telechargerBonCommande(c.id)} className="font-medium text-slate-500 hover:underline">
                        Bon de commande
                      </button>
                      {c.statut !== 'brouillon' && c.statut !== 'validee' && c.statut !== 'envoyee' && (
                        <button onClick={() => api.telechargerBonReception(c.id)} className="font-medium text-slate-500 hover:underline">
                          Bon de réception
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-400">
                    Aucune commande.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination page={page} pageCount={pageCount} onChange={setPage} totalItems={totalItems} pageSize={pageSize} />
        </div>
      )}

      {creating && (
        <Modal title={editingId ? `Modifier la commande #${editingId}` : 'Nouvelle commande fournisseur'} onClose={() => { setCreating(false); setEditingId(null) }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Fournisseur</label>
              <SearchableSelect
                value={form.fournisseur_id}
                onChange={selectFournisseur}
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
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">Articles commandés</label>
                <button type="button" onClick={addLigne} className="text-xs font-medium text-teal-700 hover:underline">
                  + Ajouter un article
                </button>
              </div>
              <div className="space-y-2">
                {lignes.map((l) => (
                  <div key={l.key} className="flex items-end gap-2 rounded-md border border-slate-200 p-2">
                    <div className="flex-1">
                      <SearchableSelect
                        value={l.produit_id}
                        onChange={(v) => selectProduitForLigne(l.key, v)}
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
                    <div className="w-28">
                      <input
                        type="number"
                        min={0}
                        value={l.prix_unitaire}
                        onChange={(e) => updateLigne(l.key, { prix_unitaire: Number(e.target.value) })}
                        className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
                        placeholder="Prix unit."
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
              <p className="mt-2 text-right text-sm font-semibold text-slate-900">Total : {formatGNF(totalForm)}</p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setCreating(false); setEditingId(null) }} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Annuler
              </button>
              <button type="submit" disabled={saving} className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
                {saving ? 'Enregistrement…' : editingId ? 'Enregistrer les modifications' : 'Créer la commande'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {viewing && (
        <Modal wide title={`Commande #${viewing.commande.id} — ${nomFournisseur(viewing.commande.fournisseur_id)}`} onClose={() => setViewing(null)}>
          {viewLoading ? (
            <p className="text-sm text-slate-500">Chargement…</p>
          ) : viewing.articles.length === 0 ? (
            <p className="text-sm text-slate-400">Aucun article enregistré pour cette commande.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="whitespace-nowrap px-3 py-2">Produit</th>
                    <th className="whitespace-nowrap px-3 py-2 text-right">Commandé</th>
                    <th className="whitespace-nowrap px-3 py-2 text-right">Reçu</th>
                    <th className="whitespace-nowrap px-3 py-2 text-right">Prix unit.</th>
                    <th className="whitespace-nowrap px-3 py-2 text-right">Sous-total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewing.articles.map((a) => (
                    <tr key={a.id}>
                      <td className="px-3 py-2">{a.produit_nom || nomProduit(a.produit_id)}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-right">{a.quantite}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-right">
                        <span className={a.quantite_recue >= a.quantite ? 'text-emerald-700' : 'text-slate-600'}>{a.quantite_recue}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right">{formatGNF(a.prix_unitaire)}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-right font-medium">{formatGNF(a.quantite * a.prix_unitaire)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50">
                    <td colSpan={4} className="whitespace-nowrap px-3 py-2 text-right font-semibold">Total</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right font-semibold">{formatGNF(viewing.commande.montant)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Modal>
      )}

      {receiving && (
        <Modal title={`Réceptionner — Commande #${receiving.commande.id}`} onClose={() => setReceiving(null)}>
          <form onSubmit={handleSubmitReception} className="space-y-4">
            {receiving.articles.length === 0 ? (
              <p className="text-sm text-slate-500">Chargement…</p>
            ) : (
              <div className="space-y-2">
                {receiving.articles.map((a) => {
                  const restant = a.quantite - a.quantite_recue
                  return (
                    <div key={a.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-2">
                      <div>
                        <div className="text-sm font-medium text-slate-900">{a.produit_nom || nomProduit(a.produit_id)}</div>
                        <div className="text-xs text-slate-500">
                          {a.quantite_recue} / {a.quantite} déjà reçu
                          {restant <= 0 && <span className="ml-1 text-emerald-700">— complet</span>}
                        </div>
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          min={0}
                          max={restant}
                          disabled={restant <= 0}
                          value={receptionQtes[a.produit_id] ?? 0}
                          onChange={(e) =>
                            setReceptionQtes((qs) => ({ ...qs, [a.produit_id]: Number(e.target.value) }))
                          }
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm disabled:bg-slate-50"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {receptionError && <p className="text-sm text-red-600">{receptionError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setReceiving(null)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Annuler
              </button>
              <button type="submit" disabled={receptionSaving || receiving.articles.length === 0} className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
                {receptionSaving ? 'Réception…' : 'Confirmer la réception'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {correcting && (
        <Modal title={`Corriger la réception — Commande #${correcting.commande.id}`} onClose={() => setCorrecting(null)}>
          <form onSubmit={handleSubmitCorrection} className="space-y-4">
            <p className="text-xs text-slate-500">
              Ajustez la quantité réellement reçue par article (ex : erreur de saisie, produit manquant à la livraison).
            </p>
            {correcting.articles.length === 0 ? (
              <p className="text-sm text-slate-500">Chargement…</p>
            ) : (
              <div className="space-y-2">
                {correcting.articles.map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-2">
                    <div>
                      <div className="text-sm font-medium text-slate-900">{a.produit_nom || nomProduit(a.produit_id)}</div>
                      <div className="text-xs text-slate-500">Commandé : {a.quantite}</div>
                    </div>
                    <div className="w-24">
                      <input
                        type="number"
                        min={0}
                        max={a.quantite}
                        value={correctionQtes[a.produit_id] ?? a.quantite_recue}
                        onChange={(e) =>
                          setCorrectionQtes((qs) => ({ ...qs, [a.produit_id]: Number(e.target.value) }))
                        }
                        className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {correctionError && <p className="text-sm text-red-600">{correctionError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setCorrecting(null)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Annuler
              </button>
              <button type="submit" disabled={correctionSaving || correcting.articles.length === 0} className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60">
                {correctionSaving ? 'Correction…' : 'Enregistrer la correction'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
