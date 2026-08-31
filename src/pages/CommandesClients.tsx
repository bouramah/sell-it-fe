import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import SearchableSelect from '../components/SearchableSelect'
import SearchInput from '../components/SearchInput'
import { SpinnerBloc } from '../components/Spinner'
import { formatGNF } from '../lib/format'
import { useBoutiques } from '../lib/useBoutiques'
import { usePagination } from '../lib/usePagination'
import { usePermissions } from '../lib/permissions'
import { useSearch } from '../lib/useSearch'
import {
  CANAL_LABELS,
  MODE_PAIEMENT_LABELS,
  PALIER_PRIX_LABELS,
  palierSuggere,
  prixPourPalier,
  STATUT_COMMANDE_CLIENT_LABELS,
  type ArticleCommande,
  type Client,
  type CommandeClient,
  type LigneStock,
  type PalierPrix,
  type Produit,
  type StatutCommandeClient,
} from '../types'
import type { ArticleCommandeInput, CommandeClientInput } from '../types/write'

const PALIER_OPTIONS: PalierPrix[] = ['detail', 'semi_gros', 'gros']

const STATUT_TONE: Record<StatutCommandeClient, 'default' | 'success' | 'warning' | 'danger'> = {
  en_attente: 'default',
  confirmee: 'default',
  en_preparation: 'warning',
  en_livraison: 'warning',
  livree: 'success',
  annulee: 'danger',
}

const STATUTS: StatutCommandeClient[] = ['en_attente', 'confirmee', 'en_preparation', 'en_livraison', 'livree', 'annulee']

// Au-delà de cette remise (part du prix catalogue non facturée), un motif devient obligatoire
// et la commande reste bloquée en attente de validation gérant/siège — le backend est la seule
// source de vérité (recalcule et refuse si absent), ceci n'est qu'un garde-fou côté UI.
const SEUIL_REMISE = 0.10

interface ArticleFormLigne {
  key: number
  produit_id: string
  quantite: number
  palier: PalierPrix
  /** true dès que le palier ou le prix a été choisi à la main — la quantité ne le réajuste
   * alors plus automatiquement (on ne veut pas effacer un choix explicite). */
  palierManuel: boolean
  prix_unitaire: number
}

let ligneKeySeq = 0
function nouvelleLigne(): ArticleFormLigne {
  return { key: ++ligneKeySeq, produit_id: '', quantite: 1, palier: 'detail', palierManuel: false, prix_unitaire: 0 }
}

interface FormEnTete {
  client_nom: string
  boutique_id: string
  canal: CommandeClientInput['canal']
  mode_paiement: CommandeClientInput['mode_paiement']
}

const EMPTY_FORM: FormEnTete = {
  client_nom: '',
  boutique_id: '',
  canal: 'boutique',
  mode_paiement: 'especes',
}

export default function CommandesClients() {
  const [commandes, setCommandes] = useState<CommandeClient[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [produits, setProduits] = useState<Produit[]>([])
  const [stockForm, setStockForm] = useState<LigneStock[]>([])
  const [boutiqueId, setBoutiqueId] = useState('')
  const { boutiques, nomBoutique } = useBoutiques()
  const { commandeClient: canGererCommande, remiseValidation } = usePermissions()

  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [lignes, setLignes] = useState<ArticleFormLigne[]>([nouvelleLigne()])
  const [remiseMotif, setRemiseMotif] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [validatingId, setValidatingId] = useState<string | null>(null)

  const [viewing, setViewing] = useState<{ commande: CommandeClient; articles: ArticleCommande[] } | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  function refresh() {
    setLoading(true)
    Promise.all([
      api.commandesClients().then(setCommandes),
      api.clients().then(setClients),
      api.produits().then(setProduits),
    ]).finally(() => setLoading(false))
  }

  useEffect(refresh, [])
  useEffect(() => {
    if (form.boutique_id) api.stock(form.boutique_id).then(setStockForm)
    else setStockForm([])
  }, [form.boutique_id])

  const preFiltrees = boutiqueId ? commandes.filter((c) => c.boutique_id === boutiqueId) : commandes
  const getFields = useCallback((c: CommandeClient) => [c.id, c.client_nom], [])
  const { query, setQuery, filtered } = useSearch(preFiltrees, getFields)
  const { page, setPage, pageCount, paginated, totalItems, pageSize } = usePagination(filtered)

  const nomProduit = useCallback((id: string) => produits.find((p) => p.id === id)?.nom ?? id, [produits])

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setLignes([nouvelleLigne()])
    setRemiseMotif('')
    setError(null)
    setCreating(true)
  }

  async function openEdit(c: CommandeClient) {
    setError(null)
    setEditingId(c.id)
    setForm({ client_nom: c.client_nom, boutique_id: c.boutique_id, canal: c.canal, mode_paiement: c.mode_paiement })
    setLignes([nouvelleLigne()])
    setRemiseMotif(c.remise_motif ?? '')
    setCreating(true)
    const detail = await api.commandeClient(c.id)
    setLignes(
      detail.articles.length > 0
        ? detail.articles.map((a) => ({ key: ++ligneKeySeq, produit_id: a.produit_id, quantite: a.quantite, palier: 'detail' as PalierPrix, palierManuel: true, prix_unitaire: a.prix_unitaire }))
        : [nouvelleLigne()]
    )
  }

  function updateLigne(key: number, patch: Partial<ArticleFormLigne>) {
    setLignes((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  }

  function selectProduitForLigne(key: number, produitId: string) {
    const s = stockForm.find((x) => x.produit_id === produitId)
    const p = produits.find((x) => x.id === produitId)
    const ligneActuelle = lignes.find((l) => l.key === key)
    const palier = p ? palierSuggere(ligneActuelle?.quantite ?? 1, p) : 'detail'
    updateLigne(key, { produit_id: produitId, palier, palierManuel: false, prix_unitaire: s ? prixPourPalier(s, palier) : 0 })
  }

  function changerQuantiteLigne(key: number, quantite: number) {
    const l = lignes.find((x) => x.key === key)
    const p = l ? produits.find((x) => x.id === l.produit_id) : undefined
    if (!l || !p || l.palierManuel) {
      updateLigne(key, { quantite })
      return
    }
    // Le palier suit toujours la quantité (seuils définis au niveau du produit) — le prix, lui,
    // dépend du stock de la boutique choisie et peut être absent si le produit n'y est pas stocké.
    const s = stockForm.find((x) => x.produit_id === l.produit_id)
    const palier = palierSuggere(quantite, p)
    updateLigne(key, { quantite, palier, prix_unitaire: s ? prixPourPalier(s, palier) : l.prix_unitaire })
  }

  function changerPalierLigne(key: number, palier: PalierPrix) {
    const l = lignes.find((x) => x.key === key)
    const s = l ? stockForm.find((x) => x.produit_id === l.produit_id) : undefined
    updateLigne(key, { palier, palierManuel: true, prix_unitaire: s ? prixPourPalier(s, palier) : 0 })
  }

  function changerPrixLigne(key: number, prix_unitaire: number) {
    updateLigne(key, { prix_unitaire, palierManuel: true })
  }

  function addLigne() {
    setLignes((ls) => [...ls, nouvelleLigne()])
  }

  function removeLigne(key: number) {
    setLignes((ls) => (ls.length > 1 ? ls.filter((l) => l.key !== key) : ls))
  }

  const totalForm = lignes.reduce((sum, l) => sum + l.quantite * l.prix_unitaire, 0)
  const totalCatalogueForm = lignes.reduce((sum, l) => {
    const s = stockForm.find((x) => x.produit_id === l.produit_id)
    return sum + l.quantite * (s ? prixPourPalier(s, l.palier) : l.prix_unitaire)
  }, 0)
  const remisePctForm = totalCatalogueForm > 0 ? (totalCatalogueForm - totalForm) / totalCatalogueForm : 0
  const remiseDepasseSeuilForm = remisePctForm > SEUIL_REMISE

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (lignes.some((l) => !l.produit_id || l.quantite <= 0)) {
      setError('Chaque article doit avoir un produit et une quantité positive.')
      return
    }
    if (remiseDepasseSeuilForm && !remiseMotif.trim()) {
      setError(`Motif obligatoire pour une remise supérieure à ${Math.round(SEUIL_REMISE * 100)} % du prix catalogue.`)
      return
    }
    setSaving(true)
    setError(null)
    try {
      const articles: ArticleCommandeInput[] = lignes.map((l) => ({ produit_id: l.produit_id, quantite: l.quantite, palier: l.palier, prix_unitaire: l.prix_unitaire }))
      const remise_motif = remiseDepasseSeuilForm ? remiseMotif.trim() : null
      if (editingId) {
        await api.modifierArticlesCommandeClient(editingId, { ...form, articles, remise_motif })
      } else {
        await api.creerCommandeClient({ ...form, statut: 'en_attente', articles, remise_motif })
      }
      setCreating(false)
      setEditingId(null)
      refresh()
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : editingId ? 'Échec de la modification de la commande.' : 'Échec de la création de la commande.')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatutChange(c: CommandeClient, statut: StatutCommandeClient) {
    try {
      await api.modifierCommandeClient(c.id, statut)
      refresh()
    } catch (err) {
      window.alert(err instanceof Error && err.message ? err.message : 'Action impossible.')
    }
  }

  async function handleValiderRemise(c: CommandeClient) {
    setValidatingId(c.id)
    try {
      await api.validerRemiseCommandeClient(c.id)
      refresh()
    } catch (err) {
      window.alert(err instanceof Error && err.message ? err.message : 'Échec de la validation.')
    } finally {
      setValidatingId(null)
    }
  }

  async function openView(c: CommandeClient) {
    setViewLoading(true)
    setViewing({ commande: c, articles: [] })
    try {
      const detail = await api.commandeClient(c.id)
      setViewing({ commande: c, articles: detail.articles })
    } finally {
      setViewLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Commandes clients</h1>
          <p className="text-sm text-slate-500">Web, mobile et prise en boutique</p>
        </div>
        {canGererCommande && (
          <button onClick={openCreate} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
            + Nouvelle commande client
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
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Boutique</th>
                <th className="px-4 py-3">Canal</th>
                <th className="px-4 py-3">Paiement</th>
                <th className="px-4 py-3 text-right">Montant</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">#{c.id}</td>
                  <td className="px-4 py-3 text-slate-600">{c.client_nom}</td>
                  <td className="px-4 py-3 text-slate-600">{nomBoutique(c.boutique_id)}</td>
                  <td className="px-4 py-3 text-slate-600">{CANAL_LABELS[c.canal]}</td>
                  <td className="px-4 py-3 text-slate-600">{MODE_PAIEMENT_LABELS[c.mode_paiement]}</td>
                  <td className="px-4 py-3 text-right text-slate-900">{formatGNF(c.montant)}</td>
                  <td className="px-4 py-3">
                    {canGererCommande && (
                      <div className="w-40">
                        <SearchableSelect
                          value={c.statut}
                          onChange={(v) => handleStatutChange(c, v as StatutCommandeClient)}
                          options={STATUTS.map((s) => ({ value: s, label: STATUT_COMMANDE_CLIENT_LABELS[s] }))}
                        />
                      </div>
                    )}
                    <div className="mt-1">
                      <Badge tone={STATUT_TONE[c.statut]}>{STATUT_COMMANDE_CLIENT_LABELS[c.statut]}</Badge>
                    </div>
                    {c.remise_statut === 'en_attente' && (
                      <div className="mt-1">
                        <Badge tone="warning">Remise en attente</Badge>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1">
                      <button onClick={() => openView(c)} className="font-medium text-teal-700 hover:underline">
                        Voir
                      </button>
                      {c.statut === 'en_attente' && canGererCommande && (
                        <button onClick={() => openEdit(c)} className="font-medium text-teal-700 hover:underline">
                          Modifier
                        </button>
                      )}
                      {c.remise_statut === 'en_attente' && remiseValidation && (
                        <button
                          onClick={() => handleValiderRemise(c)}
                          disabled={validatingId === c.id}
                          className="font-medium text-amber-700 hover:underline disabled:opacity-50"
                        >
                          {validatingId === c.id ? 'Validation…' : 'Valider la remise'}
                        </button>
                      )}
                      <button onClick={() => api.telechargerFacture(c.id)} className="font-medium text-slate-500 hover:underline">
                        Facture
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-400">
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
        <Modal title={editingId ? `Modifier la commande #${editingId}` : 'Nouvelle commande client'} onClose={() => { setCreating(false); setEditingId(null) }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Client</label>
              <SearchableSelect
                value={form.client_nom}
                onChange={(v) => setForm({ ...form, client_nom: v })}
                options={clients.map((c) => ({ value: c.nom, label: `${c.nom} — ${c.contact}` }))}
                required
              />
            </div>
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
                <label className="mb-1 block text-sm font-medium text-slate-700">Canal</label>
                <SearchableSelect
                  value={form.canal}
                  onChange={(v) => setForm({ ...form, canal: v as CommandeClientInput['canal'] })}
                  options={(['web', 'mobile_client', 'boutique'] as const).map((c) => ({ value: c, label: CANAL_LABELS[c] }))}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Mode de paiement</label>
                <SearchableSelect
                  value={form.mode_paiement}
                  onChange={(v) => setForm({ ...form, mode_paiement: v as CommandeClientInput['mode_paiement'] })}
                  options={(Object.keys(MODE_PAIEMENT_LABELS) as (keyof typeof MODE_PAIEMENT_LABELS)[]).map((m) => ({
                    value: m,
                    label: MODE_PAIEMENT_LABELS[m],
                  }))}
                  required
                />
              </div>
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
                  <div key={l.key} className="space-y-2 rounded-md border border-slate-200 p-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <SearchableSelect
                          value={l.produit_id}
                          onChange={(v) => selectProduitForLigne(l.key, v)}
                          options={produits.map((p) => ({ value: p.id, label: p.nom }))}
                          placeholder="Produit…"
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
                    <div className="flex items-end gap-2">
                      <div className="w-20">
                        <label className="mb-1 block text-xs text-slate-500">Qté</label>
                        <input
                          type="number"
                          min={1}
                          value={l.quantite}
                          onChange={(e) => changerQuantiteLigne(l.key, Number(e.target.value))}
                          className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
                          placeholder="Qté"
                          required
                        />
                      </div>
                      <div className="w-32">
                        <label className="mb-1 block text-xs text-slate-500">Palier</label>
                        <select
                          value={l.palier}
                          onChange={(e) => changerPalierLigne(l.key, e.target.value as PalierPrix)}
                          className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
                        >
                          {PALIER_OPTIONS.map((p) => (
                            <option key={p} value={p}>{PALIER_PRIX_LABELS[p]}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="mb-1 block text-xs text-slate-500">Prix unit. (GNF)</label>
                        <input
                          type="number"
                          min={0}
                          value={l.prix_unitaire}
                          onChange={(e) => changerPrixLigne(l.key, Number(e.target.value))}
                          className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
                          placeholder="Prix unit."
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-right text-sm font-semibold text-slate-900">Total : {formatGNF(totalForm)}</p>
            </div>

            {remiseDepasseSeuilForm && (
              <div className="space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3">
                <p className="text-sm font-semibold text-amber-900">
                  Remise de {Math.round(remisePctForm * 100)} % — validation requise
                </p>
                <p className="text-xs text-amber-800">
                  Au-delà de {Math.round(SEUIL_REMISE * 100)} % sous le prix catalogue, un motif est obligatoire et la commande restera en
                  attente de validation par un gérant ou le siège avant de pouvoir être livrée.
                </p>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Motif de la remise</label>
                  <input
                    type="text"
                    value={remiseMotif}
                    onChange={(e) => setRemiseMotif(e.target.value)}
                    placeholder="Ex : négociation directeur boutique"
                    className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
                  />
                </div>
              </div>
            )}

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
        <Modal wide title={`Commande #${viewing.commande.id} — ${viewing.commande.client_nom}`} onClose={() => setViewing(null)}>
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
                    <th className="whitespace-nowrap px-3 py-2">Palier</th>
                    <th className="whitespace-nowrap px-3 py-2 text-right">Qté</th>
                    <th className="whitespace-nowrap px-3 py-2 text-right">Prix facturé</th>
                    <th className="whitespace-nowrap px-3 py-2 text-right">Prix catalogue à la vente</th>
                    <th className="whitespace-nowrap px-3 py-2 text-right">Sous-total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewing.articles.map((a) => (
                    <tr key={a.id}>
                      <td className="px-3 py-2">{a.produit_nom || nomProduit(a.produit_id)}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-500">{PALIER_PRIX_LABELS[a.palier]}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-right">{a.quantite}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-right">{formatGNF(a.prix_unitaire)}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-right text-slate-500">
                        {a.prix_catalogue_a_la_vente === null ? (
                          '—'
                        ) : a.prix_catalogue_a_la_vente !== a.prix_unitaire ? (
                          <span className="text-amber-700">{formatGNF(a.prix_catalogue_a_la_vente)}</span>
                        ) : (
                          formatGNF(a.prix_catalogue_a_la_vente)
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right font-medium">{formatGNF(a.quantite * a.prix_unitaire)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50">
                    <td colSpan={5} className="whitespace-nowrap px-3 py-2 text-right font-semibold">Total</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right font-semibold">{formatGNF(viewing.commande.montant)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
