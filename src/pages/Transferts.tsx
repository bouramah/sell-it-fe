import { useEffect, useState } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import { useBoutiques } from '../lib/useBoutiques'
import { STATUT_TRANSFERT_LABELS, type Produit, type StatutTransfert, type TransfertStock } from '../types'

const STATUT_TONE: Record<StatutTransfert, 'default' | 'warning' | 'success'> = {
  demande: 'default',
  valide: 'warning',
  en_transit: 'warning',
  recu: 'success',
}

export default function Transferts() {
  const [transferts, setTransferts] = useState<TransfertStock[]>([])
  const [produits, setProduits] = useState<Produit[]>([])
  const { nomBoutique } = useBoutiques()

  useEffect(() => {
    api.transferts().then(setTransferts)
    api.catalogue().then(setProduits)
  }, [])

  const nomProduit = (id: string) => produits.find((p) => p.id === id)?.nom ?? id

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transferts de stock</h1>
          <p className="text-sm text-slate-500">Mouvements inter-boutiques</p>
        </div>
        <button className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
          + Nouveau transfert
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Boutique source</th>
              <th className="px-4 py-3">Boutique destination</th>
              <th className="px-4 py-3 text-right">Quantité</th>
              <th className="px-4 py-3">Demandeur</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transferts.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{nomProduit(t.produit_id)}</td>
                <td className="px-4 py-3 text-slate-600">{nomBoutique(t.boutique_source_id)}</td>
                <td className="px-4 py-3 text-slate-600">{nomBoutique(t.boutique_destination_id)}</td>
                <td className="px-4 py-3 text-right">{t.quantite}</td>
                <td className="px-4 py-3 text-slate-600">{t.demandeur}</td>
                <td className="px-4 py-3">
                  <Badge tone={STATUT_TONE[t.statut]}>{STATUT_TRANSFERT_LABELS[t.statut]}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
