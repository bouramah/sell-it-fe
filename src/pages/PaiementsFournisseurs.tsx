import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import SearchInput from '../components/SearchInput'
import { formatGNF, formatShortDate } from '../lib/format'
import { useBoutiques } from '../lib/useBoutiques'
import { useSearch } from '../lib/useSearch'
import { MODE_PAIEMENT_LABELS, STATUT_PAIEMENT_LABELS, type PaiementFournisseur, type StatutPaiement } from '../types'

const TONE: Record<StatutPaiement, 'success' | 'warning' | 'default'> = {
  encaisse: 'success',
  en_attente: 'warning',
  paye: 'success',
  partiel: 'warning',
}

export default function PaiementsFournisseurs() {
  const [paiements, setPaiements] = useState<PaiementFournisseur[]>([])
  const { nomBoutique } = useBoutiques()
  const [payingId, setPayingId] = useState<string | null>(null)

  function refresh() {
    api.paiementsFournisseurs().then(setPaiements)
  }

  useEffect(refresh, [])

  const getFields = useCallback((p: PaiementFournisseur) => [p.fournisseur_nom, p.reference], [])
  const { query, setQuery, filtered } = useSearch(paiements, getFields)

  async function handlePayer(p: PaiementFournisseur) {
    setPayingId(p.id)
    try {
      await api.payerPaiementFournisseur(p.id)
      refresh()
    } finally {
      setPayingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Paiements fournisseurs</h1>
        <p className="text-sm text-slate-500">Règlements aux fournisseurs, avec justificatif</p>
      </div>

      <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un paiement…" />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Fournisseur</th>
              <th className="px-4 py-3">Commande liée</th>
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
                <td className="px-4 py-3 font-medium text-slate-900">{p.fournisseur_nom}</td>
                <td className="px-4 py-3 text-slate-600">{p.reference}</td>
                <td className="px-4 py-3 text-slate-600">{nomBoutique(p.boutique_id)}</td>
                <td className="px-4 py-3 text-slate-600">{MODE_PAIEMENT_LABELS[p.mode_paiement]}</td>
                <td className="px-4 py-3 text-slate-500">{formatShortDate(p.date)}</td>
                <td className="px-4 py-3 text-right text-slate-900">{formatGNF(p.montant)}</td>
                <td className="px-4 py-3">
                  <Badge tone={TONE[p.statut]}>{STATUT_PAIEMENT_LABELS[p.statut]}</Badge>
                  {(p.statut === 'en_attente' || p.statut === 'partiel') && (
                    <button
                      onClick={() => handlePayer(p)}
                      disabled={payingId === p.id}
                      className="ml-2 text-xs font-medium text-teal-700 hover:underline disabled:opacity-50"
                    >
                      {payingId === p.id ? 'Règlement…' : 'Marquer payé'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400">
        Cette liste est générée automatiquement : un paiement « en attente » apparaît dès qu'une commande fournisseur
        est intégralement réceptionnée, ou lors de l'encaissement d'un remboursement de dette fournisseur.
      </p>
    </div>
  )
}
