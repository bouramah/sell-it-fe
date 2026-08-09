import { useEffect, useState } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import { formatGNF } from '../lib/format'
import { SECTEUR_LABELS, type Produit } from '../types'

export default function Catalogue() {
  const [q, setQ] = useState('')
  const [produits, setProduits] = useState<Produit[]>([])

  useEffect(() => {
    const handle = setTimeout(() => {
      api.catalogue(q || undefined).then(setProduits)
    }, 150)
    return () => clearTimeout(handle)
  }, [q])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Catalogue & recherche IA</h1>
          <p className="text-sm text-slate-500">Moteur de recherche et recommandations produit</p>
        </div>
        <button className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
          + Ajouter un produit
        </button>
      </div>

      <div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Recherche IA — tolérante aux fautes…"
          className="w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {produits.map((p) => (
          <div key={p.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex h-24 items-center justify-center rounded-md bg-slate-100 text-xs text-slate-400">
              photo produit
            </div>
            <div className="text-sm font-medium text-slate-900">{p.nom}</div>
            <div className="text-xs text-slate-500">
              <Badge>{SECTEUR_LABELS[p.secteur]}</Badge>
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-900">{formatGNF(p.prix)}</div>
          </div>
        ))}
        {produits.length === 0 && <p className="text-sm text-slate-400">Aucun produit ne correspond à la recherche.</p>}
      </div>
    </div>
  )
}
