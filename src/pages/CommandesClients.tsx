import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import SearchableSelect from '../components/SearchableSelect'
import SearchInput from '../components/SearchInput'
import { formatGNF } from '../lib/format'
import { useBoutiques } from '../lib/useBoutiques'
import { useSearch } from '../lib/useSearch'
import {
  CANAL_LABELS,
  MODE_PAIEMENT_LABELS,
  STATUT_COMMANDE_CLIENT_LABELS,
  type CommandeClient,
  type StatutCommandeClient,
} from '../types'

const STATUT_TONE: Record<StatutCommandeClient, 'default' | 'success' | 'warning' | 'danger'> = {
  en_attente: 'default',
  confirmee: 'default',
  en_preparation: 'warning',
  en_livraison: 'warning',
  livree: 'success',
  annulee: 'danger',
}

export default function CommandesClients() {
  const [commandes, setCommandes] = useState<CommandeClient[]>([])
  const [boutiqueId, setBoutiqueId] = useState('')
  const { boutiques, nomBoutique } = useBoutiques()

  useEffect(() => {
    api.commandesClients().then(setCommandes)
  }, [])

  const preFiltrees = boutiqueId ? commandes.filter((c) => c.boutique_id === boutiqueId) : commandes
  const getFields = useCallback((c: CommandeClient) => [c.id, c.client_nom], [])
  const { query, setQuery, filtered } = useSearch(preFiltrees, getFields)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Commandes clients</h1>
          <p className="text-sm text-slate-500">Web, mobile et prise en boutique</p>
        </div>
        <button className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
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
                  <Badge tone={STATUT_TONE[c.statut]}>{STATUT_COMMANDE_CLIENT_LABELS[c.statut]}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
