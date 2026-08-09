import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import SearchInput from '../components/SearchInput'
import { formatGNF, formatShortDate } from '../lib/format'
import { useBoutiques } from '../lib/useBoutiques'
import { useSearch } from '../lib/useSearch'
import { MODE_PAIEMENT_LABELS, STATUT_PAIEMENT_LABELS, type PaiementClient, type StatutPaiement } from '../types'

const TONE: Record<StatutPaiement, 'success' | 'warning' | 'default'> = {
  encaisse: 'success',
  en_attente: 'warning',
  paye: 'success',
  partiel: 'warning',
}

export default function PaiementsClients() {
  const [paiements, setPaiements] = useState<PaiementClient[]>([])
  const { nomBoutique } = useBoutiques()

  useEffect(() => {
    api.paiementsClients().then(setPaiements)
  }, [])

  const getFields = useCallback((p: PaiementClient) => [p.client_nom, p.reference], [])
  const { query, setQuery, filtered } = useSearch(paiements, getFields)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Paiements clients</h1>
          <p className="text-sm text-slate-500">Encaissements reçus, avec reçu associé</p>
        </div>
        <button className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
          + Enregistrer un paiement client
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
