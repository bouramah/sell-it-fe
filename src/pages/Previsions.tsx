import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useBoutiques } from '../lib/useBoutiques'
import type { SuggestionAvecProduit } from '../types'

export default function Previsions() {
  const [suggestions, setSuggestions] = useState<SuggestionAvecProduit[]>([])
  const { nomBoutique } = useBoutiques()

  useEffect(() => {
    api.previsions().then(setSuggestions)
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Prévisions de demande</h1>
        <p className="text-sm text-slate-500">Suggestions de réapprovisionnement par boutique et produit</p>
      </div>

      <section className="rounded-lg border border-teal-100 bg-teal-50/50 p-4">
        <h2 className="text-sm font-semibold text-teal-900">IA — Prévision de la demande</h2>
        <p className="text-sm text-teal-800">
          Suggestions de réapprovisionnement basées sur les ventes des 30 derniers jours, par boutique et par produit.
        </p>
      </section>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Boutique</th>
              <th className="px-4 py-3 text-right">Stock actuel</th>
              <th className="px-4 py-3 text-right">Ventes prévues (14j)</th>
              <th className="px-4 py-3 text-right">Quantité suggérée</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {suggestions.map((s) => (
              <tr key={`${s.produit_id}-${s.boutique_id}`} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{s.produit_nom}</td>
                <td className="px-4 py-3 text-slate-600">{nomBoutique(s.boutique_id)}</td>
                <td className="px-4 py-3 text-right text-slate-600">{s.stock_actuel}</td>
                <td className="px-4 py-3 text-right text-slate-600">{s.ventes_prevues_14j}</td>
                <td className="px-4 py-3 text-right font-medium text-slate-900">{s.quantite_suggeree} unités</td>
                <td className="px-4 py-3">
                  <button className="text-sm font-medium text-teal-700 hover:underline">Créer commande fournisseur</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
