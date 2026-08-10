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
  type Client,
  type CommandeClient,
  type StatutCommandeClient,
} from '../types'
import type { CommandeClientInput } from '../types/write'

const STATUT_TONE: Record<StatutCommandeClient, 'default' | 'success' | 'warning' | 'danger'> = {
  en_attente: 'default',
  confirmee: 'default',
  en_preparation: 'warning',
  en_livraison: 'warning',
  livree: 'success',
  annulee: 'danger',
}

const STATUTS: StatutCommandeClient[] = ['en_attente', 'confirmee', 'en_preparation', 'en_livraison', 'livree', 'annulee']

const EMPTY_FORM: CommandeClientInput = {
  client_nom: '',
  boutique_id: '',
  canal: 'boutique',
  mode_paiement: 'especes',
  montant: 0,
  statut: 'en_attente',
}

export default function CommandesClients() {
  const [commandes, setCommandes] = useState<CommandeClient[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [boutiqueId, setBoutiqueId] = useState('')
  const { boutiques, nomBoutique } = useBoutiques()

  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<CommandeClientInput>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function refresh() {
    api.commandesClients().then(setCommandes)
    api.clients().then(setClients)
  }

  useEffect(refresh, [])

  const preFiltrees = boutiqueId ? commandes.filter((c) => c.boutique_id === boutiqueId) : commandes
  const getFields = useCallback((c: CommandeClient) => [c.id, c.client_nom], [])
  const { query, setQuery, filtered } = useSearch(preFiltrees, getFields)

  function openCreate() {
    setForm(EMPTY_FORM)
    setError(null)
    setCreating(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await api.creerCommandeClient(form)
      setCreating(false)
      refresh()
    } catch {
      setError("Échec de la création de la commande.")
    } finally {
      setSaving(false)
    }
  }

  async function handleStatutChange(c: CommandeClient, statut: StatutCommandeClient) {
    await api.modifierCommandeClient(c.id, statut)
    refresh()
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
      </div>

      {creating && (
        <Modal title="Nouvelle commande client" onClose={() => setCreating(false)}>
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
              <label className="mb-1 block text-sm font-medium text-slate-700">Montant (GNF)</label>
              <input
                type="number"
                min={0}
                value={form.montant}
                onChange={(e) => setForm({ ...form, montant: Number(e.target.value) })}
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
                {saving ? 'Création…' : 'Créer la commande'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
