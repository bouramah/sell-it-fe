import { useEffect, useState } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import { formatDate } from '../lib/format'
import type { Boutique, LigneStock } from '../types'

export default function Stock() {
  const [boutiques, setBoutiques] = useState<Boutique[]>([])
  const [boutiqueId, setBoutiqueId] = useState('')
  const [lignes, setLignes] = useState<LigneStock[]>([])

  useEffect(() => {
    api.boutiques().then(setBoutiques)
  }, [])

  useEffect(() => {
    api.stock(boutiqueId || undefined).then(setLignes)
  }, [boutiqueId])

  const boutiquesById = Object.fromEntries(boutiques.map((b) => [b.id, b]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Stock par boutique</h1>
        <p className="text-sm text-slate-500">Quantités disponibles, réservées et seuils d'alerte</p>
      </div>

      <select
        value={boutiqueId}
        onChange={(e) => setBoutiqueId(e.target.value)}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
      >
        <option value="">Toutes les boutiques</option>
        {boutiques.map((b) => (
          <option key={b.id} value={b.id}>
            {b.nom}
          </option>
        ))}
      </select>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Boutique</th>
              <th className="px-4 py-3">Disponible</th>
              <th className="px-4 py-3">Réservé</th>
              <th className="px-4 py-3">Seuil d'alerte</th>
              <th className="px-4 py-3">Dernier mouvement</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lignes.map((l) => (
              <tr key={`${l.boutique_id}-${l.produit_id}`} className={l.en_alerte ? 'bg-amber-50/60' : 'hover:bg-slate-50'}>
                <td className="px-4 py-3 font-medium text-slate-900">{l.produit_nom}</td>
                <td className="px-4 py-3 text-slate-600">{boutiquesById[l.boutique_id]?.nom ?? l.boutique_id}</td>
                <td className="px-4 py-3">{l.quantite_disponible}</td>
                <td className="px-4 py-3 text-slate-600">{l.quantite_reservee}</td>
                <td className="px-4 py-3 text-slate-600">{l.seuil_alerte}</td>
                <td className="px-4 py-3 text-slate-500">{formatDate(l.derniere_mouvement)}</td>
                <td className="px-4 py-3">
                  {l.en_alerte ? <Badge tone="warning">Alerte</Badge> : <Badge tone="success">OK</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
