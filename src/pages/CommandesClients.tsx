import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import SearchableSelect from '../components/SearchableSelect'
import SearchInput from '../components/SearchInput'
import { formatGNF } from '../lib/format'
import { useBoutiques } from '../lib/useBoutiques'
import { useSearch } from '../lib/useSearch'
import {
  CANAL_LABELS,
  MODE_PAIEMENT_LABELS,
  STATUT_COMMANDE_CLIENT_LABELS,
  type ArticleCommande,
  type Client,
  type CommandeClient,
  type Produit,
  type StatutCommandeClient,
} from '../types'
import type { ArticleCommandeInput, CommandeClientInput } from '../types/write'

const STATUT_TONE: Record<StatutCommandeClient, 'default' | 'success' | 'warning' | 'danger'> = {
  en_attente: 'default',
  confirmee: 'default',
  en_preparation: 'warning',
  en_livraison: 'warning',
  livree: 'success',
  annulee: 'danger',
}

const STATUTS: StatutCommandeClient[] = ['en_attente', 'confirmee', 'en_preparation', 'en_livraison', 'livree', 'annulee']

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
  const [boutiqueId, setBoutiqueId] = useState('')
  const { boutiques, nomBoutique } = useBoutiques()

  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [lignes, setLignes] = useState<ArticleFormLigne[]>([nouvelleLigne()])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [viewing, setViewing] = useState<{ commande: CommandeClient; articles: ArticleCommande[] } | null>(null)
  const [viewLoading, setViewLoading] = useState(false)

  function refresh() {
    api.commandesClients().then(setCommandes)
    api.clients().then(setClients)
    api.produits().then(setProduits)
  }

  useEffect(refresh, [])

  const preFiltrees = boutiqueId ? commandes.filter((c) => c.boutique_id === boutiqueId) : commandes
  const getFields = useCallback((c: CommandeClient) => [c.id, c.client_nom], [])
  const { query, setQuery, filtered } = useSearch(preFiltrees, getFields)

  const nomProduit = useCallback((id: string) => produits.find((p) => p.id === id)?.nom ?? id, [produits])

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setLignes([nouvelleLigne()])
    setError(null)
    setCreating(true)
  }

  async function openEdit(c: CommandeClient) {
    setError(null)
    setEditingId(c.id)
    setForm({ client_nom: c.client_nom, boutique_id: c.boutique_id, canal: c.canal, mode_paiement: c.mode_paiement })
    setLignes([nouvelleLigne()])
    setCreating(true)
    const detail = await api.commandeClient(c.id)
    setLignes(
      detail.articles.length > 0
        ? detail.articles.map((a) => ({ key: ++ligneKeySeq, produit_id: a.produit_id, quantite: a.quantite, prix_unitaire: a.prix_unitaire }))
        : [nouvelleLigne()]
    )
  }

  function updateLigne(key: number, patch: Partial<ArticleFormLigne>) {
    setLignes((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  }

  function selectProduitForLigne(key: number, produitId: string) {
    const p = produits.find((x) => x.id === produitId)
    updateLigne(key, { produit_id: produitId, prix_unitaire: p ? p.prix : 0 })
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
        await api.modifierArticlesCommandeClient(editingId, { ...form, articles })
      } else {
        await api.creerCommandeClient({ ...form, statut: 'en_attente', articles })
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

  async function handleStatutChange(c: CommandeClient, statut: StatutCommandeClient) {
    await api.modifierCommandeClient(c.id, statut)
    refresh()
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
        <button onClick={openCreate} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
          + Nouvelle commande client
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
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">#{c.id}</td>
                <td className="px-4 py-3 text-slate-600">{c.client_nom}</td>
                <td className="px-4 py-3 text-slate-600">{nomBoutique(c.boutique_id)}</td>
                <td className="px-4 py-3 text-slate-600">{CANAL_LABELS[c.canal]}</td>
                <td className="px-4 py-3 text-slate-600">{MODE_PAIEMENT_LABELS[c.mode_paiement]}</td>
                <td className="px-4 py-3 text-right text-slate-900">{formatGNF(c.montant)}</td>
                <td className="px-4 py-3">
                  <div className="w-40">
                    <SearchableSelect
                      value={c.statut}
                      onChange={(v) => handleStatutChange(c, v as StatutCommandeClient)}
                      options={STATUTS.map((s) => ({ value: s, label: STATUT_COMMANDE_CLIENT_LABELS[s] }))}
                    />
                  </div>
                  <div className="mt-1">
                    <Badge tone={STATUT_TONE[c.statut]}>{STATUT_COMMANDE_CLIENT_LABELS[c.statut]}</Badge>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-start gap-1">
                    <button onClick={() => openView(c)} className="font-medium text-teal-700 hover:underline">
                      Voir
                    </button>
                    {c.statut === 'en_attente' && (
                      <button onClick={() => openEdit(c)} className="font-medium text-teal-700 hover:underline">
                        Modifier
                      </button>
                    )}
                    <a href={api.urlFacture(c.id)} className="font-medium text-slate-500 hover:underline">
                      Facture
                    </a>
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
      </div>

      {creating && (
        <Modal title={editingId ? `Modifier la commande #${editingId}` : 'Nouvelle commande client'} onClose={() => { setCreating(false); setEditingId(null) }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Client</label>
              <SearchableSelect
                value={form.client_nom}
                onChange={(v) => setForm({ ...form, client_nom: v })}
                options={clients.map((c) => ({ value: c.nom, label: c.nom }))}
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
        <Modal title={`Commande #${viewing.commande.id} — ${viewing.commande.client_nom}`} onClose={() => setViewing(null)}>
          {viewLoading ? (
            <p className="text-sm text-slate-500">Chargement…</p>
          ) : viewing.articles.length === 0 ? (
            <p className="text-sm text-slate-400">Aucun article enregistré pour cette commande.</p>
          ) : (
            <div className="overflow-hidden rounded-md border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Produit</th>
                    <th className="px-3 py-2 text-right">Qté</th>
                    <th className="px-3 py-2 text-right">Prix unit.</th>
                    <th className="px-3 py-2 text-right">Sous-total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewing.articles.map((a) => (
                    <tr key={a.id}>
                      <td className="px-3 py-2">{a.produit_nom || nomProduit(a.produit_id)}</td>
                      <td className="px-3 py-2 text-right">{a.quantite}</td>
                      <td className="px-3 py-2 text-right">{formatGNF(a.prix_unitaire)}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatGNF(a.quantite * a.prix_unitaire)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50">
                    <td colSpan={3} className="px-3 py-2 text-right font-semibold">Total</td>
                    <td className="px-3 py-2 text-right font-semibold">{formatGNF(viewing.commande.montant)}</td>
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
