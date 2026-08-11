import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import SearchableSelect from '../components/SearchableSelect'
import SearchInput from '../components/SearchInput'
import { formatGNF, formatShortDate } from '../lib/format'
import { useBoutiques } from '../lib/useBoutiques'
import { usePagination } from '../lib/usePagination'
import { useSearch } from '../lib/useSearch'
import {
  MODE_PAIEMENT_LABELS,
  STATUT_PAIEMENT_LABELS,
  type Caisse,
  type Client,
  type CommandeClient,
  type ModePaiement,
  type PaiementClient,
  type StatutPaiement,
} from '../types'
import type { PaiementCaisseInput, PaiementClientInput } from '../types/write'

const TONE: Record<StatutPaiement, 'success' | 'warning' | 'default'> = {
  encaisse: 'success',
  en_attente: 'warning',
  paye: 'success',
  partiel: 'warning',
}

const MODES_PAIEMENT: ModePaiement[] = ['especes', 'mobile_money', 'a_la_livraison', 'credit_client', 'virement', 'lettre_change']

const EMPTY_FORM: PaiementClientInput = {
  client_nom: '',
  commande_id: null,
  boutique_id: '',
  caisse_id: '',
  mode_paiement: 'especes',
  montant: 0,
  date_paiement: null,
}

export default function PaiementsClients() {
  const [paiements, setPaiements] = useState<PaiementClient[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [commandes, setCommandes] = useState<CommandeClient[]>([])
  const [caisses, setCaisses] = useState<Caisse[]>([])
  const { boutiques, nomBoutique } = useBoutiques()

  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<PaiementClientInput>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [clientManuel, setClientManuel] = useState(false)

  const [encaissant, setEncaissant] = useState<PaiementClient | null>(null)
  const [encaisserCaisseId, setEncaisserCaisseId] = useState('')
  const [encaisserError, setEncaisserError] = useState<string | null>(null)
  const [encaisserSaving, setEncaisserSaving] = useState(false)

  function refresh() {
    api.paiementsClients().then(setPaiements)
    api.commandesClients().then(setCommandes)
    api.caisses().then(setCaisses)
  }

  useEffect(refresh, [])
  useEffect(() => {
    api.clients().then(setClients)
  }, [])

  const nomCaisse = useCallback(
    (id: string | null) => {
      if (!id) return '—'
      const c = caisses.find((x) => x.id === id)
      return c ? `${nomBoutique(c.boutique_id)} — ${c.libelle}` : id
    },
    [caisses, nomBoutique]
  )

  const caissesOuvertesForm = caisses.filter((c) => c.statut === 'ouverte' && (!form.boutique_id || c.boutique_id === form.boutique_id))
  const caissesOuvertesEncaissant = encaissant
    ? caisses.filter((c) => c.statut === 'ouverte' && c.boutique_id === encaissant.boutique_id)
    : []

  const getFields = useCallback((p: PaiementClient) => [p.client_nom, p.reference], [])
  const { query, setQuery, filtered } = useSearch(paiements, getFields)
  const { page, setPage, pageCount, paginated, totalItems, pageSize } = usePagination(filtered)

  const commandesDuClient = form.client_nom ? commandes.filter((c) => c.client_nom === form.client_nom) : []

  const restant = useMemo(() => {
    if (!form.commande_id) return null
    const commande = commandes.find((c) => c.id === form.commande_id)
    if (!commande) return null
    const dejaPaye = paiements
      .filter((p) => p.reference === `#${form.commande_id}`)
      .reduce((sum, p) => sum + p.montant, 0)
    return commande.montant - dejaPaye
  }, [form.commande_id, commandes, paiements])

  function openCreate() {
    setForm(EMPTY_FORM)
    setError(null)
    setClientManuel(false)
    setCreating(true)
  }

  function selectClient(nom: string) {
    setForm({ ...form, client_nom: nom, commande_id: null })
  }

  function selectCommande(commandeId: string) {
    const c = commandes.find((x) => x.id === commandeId)
    setForm({
      ...form,
      commande_id: commandeId || null,
      boutique_id: c ? c.boutique_id : form.boutique_id,
      caisse_id: c && c.boutique_id !== form.boutique_id ? '' : form.caisse_id,
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.caisse_id) {
      setError('Sélectionnez la caisse dans laquelle le paiement est encaissé.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await api.creerPaiementClient(form)
      setCreating(false)
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'enregistrement du paiement.")
    } finally {
      setSaving(false)
    }
  }

  function openEncaisser(p: PaiementClient) {
    setEncaisserCaisseId('')
    setEncaisserError(null)
    setEncaissant(p)
  }

  async function handleSubmitEncaisser(e: FormEvent) {
    e.preventDefault()
    if (!encaissant) return
    if (!encaisserCaisseId) {
      setEncaisserError('Sélectionnez la caisse concernée.')
      return
    }
    setEncaisserSaving(true)
    setEncaisserError(null)
    try {
      const payload: PaiementCaisseInput = { caisse_id: encaisserCaisseId }
      await api.encaisserPaiementClient(encaissant.id, payload)
      setEncaissant(null)
      refresh()
    } catch (err) {
      setEncaisserError(err instanceof Error ? err.message : "Échec de l'encaissement.")
    } finally {
      setEncaisserSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Paiements clients</h1>
          <p className="text-sm text-slate-500">Encaissements reçus, avec reçu associé</p>
        </div>
        <button onClick={openCreate} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
          + Enregistrer un paiement
        </button>
      </div>

      <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un paiement…" />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Commande / dette liée</th>
              <th className="px-4 py-3">Boutique</th>
              <th className="px-4 py-3">Caisse</th>
              <th className="px-4 py-3">Mode de paiement</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Montant</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{p.client_nom}</td>
                <td className="px-4 py-3 text-slate-600">{p.reference}</td>
                <td className="px-4 py-3 text-slate-600">{nomBoutique(p.boutique_id)}</td>
                <td className="px-4 py-3 text-slate-600">{nomCaisse(p.caisse_id)}</td>
                <td className="px-4 py-3 text-slate-600">{MODE_PAIEMENT_LABELS[p.mode_paiement]}</td>
                <td className="px-4 py-3 text-slate-500">{formatShortDate(p.date)}</td>
                <td className="px-4 py-3 text-right text-slate-900">{formatGNF(p.montant)}</td>
                <td className="px-4 py-3">
                  <Badge tone={TONE[p.statut]}>{STATUT_PAIEMENT_LABELS[p.statut]}</Badge>
                  {p.statut === 'en_attente' && (
                    <button
                      onClick={() => openEncaisser(p)}
                      className="ml-2 text-xs font-medium text-teal-700 hover:underline"
                    >
                      Encaisser
                    </button>
                  )}
                </td>
                <td className="px-4 py-3">
                  <a href={api.urlRecu(p.id)} className="font-medium text-teal-700 hover:underline">
                    Reçu
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} pageCount={pageCount} onChange={setPage} totalItems={totalItems} pageSize={pageSize} />
      </div>
      <p className="text-xs text-slate-400">
        Un paiement apparaît automatiquement à la création d'une commande client payée immédiatement (hors crédit
        client), ou lors de l'encaissement d'un remboursement de dette. Vous pouvez aussi en enregistrer un
        manuellement ci-dessus, en le liant ou non à une commande.
      </p>

      {creating && (
        <Modal title="Enregistrer un paiement client" onClose={() => setCreating(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">Client</label>
                <button
                  type="button"
                  onClick={() => {
                    setClientManuel((m) => !m)
                    selectClient('')
                  }}
                  className="text-xs font-medium text-teal-700 hover:underline"
                >
                  {clientManuel ? 'Liste' : 'Client de passage'}
                </button>
              </div>
              {clientManuel ? (
                <input
                  value={form.client_nom}
                  onChange={(e) => setForm({ ...form, client_nom: e.target.value, commande_id: null })}
                  placeholder="Nom du client"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              ) : (
                <SearchableSelect
                  value={form.client_nom}
                  onChange={selectClient}
                  options={clients.map((c) => ({ value: c.nom, label: `${c.nom} — ${c.contact}` }))}
                  required
                />
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Commande liée (optionnel)</label>
              <SearchableSelect
                value={form.commande_id ?? ''}
                onChange={selectCommande}
                options={commandesDuClient.map((c) => ({ value: c.id, label: `#${c.id} — ${formatGNF(c.montant)}` }))}
                allowEmpty="Paiement direct (aucune commande)"
                placeholder="Paiement direct (aucune commande)"
              />
              {restant !== null && (
                <p className="mt-1 text-xs text-slate-500">Solde restant sur cette commande : {formatGNF(restant)}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Boutique</label>
              <SearchableSelect
                value={form.boutique_id}
                onChange={(v) => setForm({ ...form, boutique_id: v, caisse_id: '' })}
                options={boutiques.map((b) => ({ value: b.id, label: b.nom }))}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Caisse (encaissé dans)</label>
              <SearchableSelect
                value={form.caisse_id}
                onChange={(v) => setForm({ ...form, caisse_id: v })}
                options={caissesOuvertesForm.map((c) => ({ value: c.id, label: `${nomBoutique(c.boutique_id)} — ${c.libelle}` }))}
                required
              />
              {form.boutique_id && caissesOuvertesForm.length === 0 && (
                <p className="mt-1 text-xs text-red-600">Aucune caisse ouverte pour cette boutique.</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Mode de paiement</label>
                <SearchableSelect
                  value={form.mode_paiement}
                  onChange={(v) => setForm({ ...form, mode_paiement: v as ModePaiement })}
                  options={MODES_PAIEMENT.map((m) => ({ value: m, label: MODE_PAIEMENT_LABELS[m] }))}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Montant (GNF)</label>
                <input
                  type="number"
                  min={1}
                  value={form.montant || ''}
                  onChange={(e) => setForm({ ...form, montant: Number(e.target.value) })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Date (optionnel — aujourd'hui par défaut)</label>
              <input
                type="date"
                value={form.date_paiement ?? ''}
                onChange={(e) => setForm({ ...form, date_paiement: e.target.value || null })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
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

      {encaissant && (
        <Modal title={`Encaisser — ${encaissant.client_nom}`} onClose={() => setEncaissant(null)}>
          <form onSubmit={handleSubmitEncaisser} className="space-y-4">
            <p className="text-sm text-slate-600">
              Montant à encaisser : <span className="font-semibold text-slate-900">{formatGNF(encaissant.montant)}</span>
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Caisse concernée</label>
              <SearchableSelect
                value={encaisserCaisseId}
                onChange={setEncaisserCaisseId}
                options={caissesOuvertesEncaissant.map((c) => ({ value: c.id, label: c.libelle }))}
                required
              />
              {caissesOuvertesEncaissant.length === 0 && (
                <p className="mt-1 text-xs text-red-600">Aucune caisse ouverte pour la boutique de ce paiement.</p>
              )}
            </div>
            {encaisserError && <p className="text-sm text-red-600">{encaisserError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEncaissant(null)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Annuler
              </button>
              <button type="submit" disabled={encaisserSaving} className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
                {encaisserSaving ? 'Encaissement…' : 'Encaisser'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
