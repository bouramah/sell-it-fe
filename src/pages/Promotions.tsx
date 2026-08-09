import { useEffect, useState } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import { useBoutiques } from '../lib/useBoutiques'
import { ORIGINE_PROMOTION_LABELS, SECTEUR_LABELS, STATUT_PROMOTION_LABELS, type OriginePromotion, type Promotion, type StatutPromotion } from '../types'

const STATUT_TONE: Record<StatutPromotion, 'warning' | 'success' | 'default'> = {
  en_attente_validation: 'warning',
  validee: 'default',
  active: 'success',
  terminee: 'default',
}

const ORIGINE_TONE: Record<OriginePromotion, 'default' | 'success'> = {
  ia: 'default',
  gerant: 'success',
  direction: 'success',
}

export default function Promotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const { nomBoutique } = useBoutiques()

  useEffect(() => {
    api.promotions().then(setPromotions)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Promotions & tarifs</h1>
          <p className="text-sm text-slate-500">Campagnes tarifaires, humaines et suggérées par l'IA</p>
        </div>
        <button className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
          + Nouvelle promotion
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Promotion</th>
              <th className="px-4 py-3">Boutique / secteur</th>
              <th className="px-4 py-3">Origine</th>
              <th className="px-4 py-3">Impact estimé</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {promotions.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{p.nom}</td>
                <td className="px-4 py-3 text-slate-600">
                  {p.boutique_id ? nomBoutique(p.boutique_id) : 'Toutes boutiques'}
                  {p.secteur ? ` · ${SECTEUR_LABELS[p.secteur]}` : ''}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={ORIGINE_TONE[p.origine]}>{ORIGINE_PROMOTION_LABELS[p.origine]}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-600">{p.impact_estime}</td>
                <td className="px-4 py-3">
                  <Badge tone={STATUT_TONE[p.statut]}>{STATUT_PROMOTION_LABELS[p.statut]}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
