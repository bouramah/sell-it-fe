import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import SearchableSelect from '../components/SearchableSelect'
import SearchInput from '../components/SearchInput'
import { formatGNF, formatShortDate } from '../lib/format'
import { useBoutiques } from '../lib/useBoutiques'
import { useSearch } from '../lib/useSearch'
import {
  MODE_PAIEMENT_LABELS,
  STATUT_PAIEMENT_LABELS,
  type Client,
  type CommandeClient,
  type ModePaiement,
  type PaiementClient,
  type StatutPaiement,
} from '../types'
import type { PaiementClientInput } from '../types/write'

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
  mode_paiement: 'especes',
  montant: 0,
  date_paiement: null,
}

export default function PaiementsClients() {
  const [paiements, setPaiements] = useState<PaiementClient[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [commandes, setCommandes] = useState<CommandeClient[]>([])
  const { boutiques, nomBoutique } = useBoutiques()

  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<PaiementClientInput>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function refresh() {
    api.paiementsClients().then(setPaiements)
    api.commandesClients().then(setCommandes)
  }

  useEffect(refresh, [])
  useEffect(() => {
    api.clients().then(setClients)
  }, [])

  const getFields = useCallback((p: PaiementClient) => [p.client_nom, p.reference], [])
  const { query, setQuery, filtered } = useSearch(paiements, getFields)

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
    setCreating(true)
  }

  function selectClient(nom: string) {
    setForm({ ...form, client_nom: nom, commande_id: null })
  }

  function selectCommande(commandeId: string) {
    const c = commandes.find((x) => x.id === commandeId)
    setForm({ ...form, commande_id: commandeId || null, boutique_id: c ? c.boutique_id : form.boutique_id })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
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
              <th className="px-4 py-3">Mode de paiement</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Montant</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{p.client_nom}</td>
                <td className="px-4 py-3 text-slate-600">{p.reference}</td>
                <td className="px-4 py-3 text-slate-600">{nomBoutique(p.boutique_id)}</td>
                <td className="px-4 py-3 text-slate-600">{MODE_PAIEMENT_LABELS[p.mode_paiement]}</td>
                <td className="px-4 py-3 text-slate-500">{formatShortDate(p.date)}</td>
                <td className="px-4 py-3 text-right text-slate-900">{formatGNF(p.montant)}</td>
                <td className="px-4 py-3">
                  <Badge tone={TONE[p.statut]}>{STATUT_PAIEMENT_LABELS[p.statut]}</Badge>
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
              <label className="mb-1 block text-sm font-medium text-slate-700">Client</label>
              <SearchableSelect
                value={form.client_nom}
                onChange={selectClient}
                options={clients.map((c) => ({ value: c.nom, label: c.nom }))}
                required
              />
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
                onChange={(v) => setForm({ ...form, boutique_id: v })}
                options={boutiques.map((b) => ({ value: b.id, label: b.nom }))}
                required
              />
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
    </div>
  )
}
