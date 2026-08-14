import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, SERVER_BASE } from '../api/client'
import Badge from '../components/Badge'
import { formatGNF } from '../lib/format'
import { useSecteurs } from '../lib/useSecteurs'
import type { Produit } from '../types'

export default function Catalogue() {
  const [q, setQ] = useState('')
  const [produits, setProduits] = useState<Produit[]>([])
  const { nomSecteur } = useSecteurs()

  useEffect(() => {
    const handle = setTimeout(() => {
      api.produits(q || undefined).then(setProduits)
    }, 150)
    return () => clearTimeout(handle)
  }, [q])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Catalogue & recherche IA</h1>
        <p className="text-sm text-slate-500">Moteur de recherche et recommandations produit</p>
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
          <Link
            key={p.id}
            to={`/produits/${p.id}`}
            className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-teal-300"
          >
            <div className="mb-3 flex h-24 items-center justify-center overflow-hidden rounded-md bg-slate-100">
              {p.images[0]?.url ? (
                <img src={`${SERVER_BASE}${p.images[0].url}`} alt={p.nom} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-slate-400">photo produit</span>
              )}
            </div>
            <div className="text-sm font-medium text-slate-900">{p.nom}</div>
            <div className="text-xs text-slate-500">
              <Badge>{nomSecteur(p.secteur)}</Badge>
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-900">{formatGNF(p.prix_detail)} <span className="font-normal text-slate-400">détail</span></div>
          </Link>
        ))}
        {produits.length === 0 && <p className="text-sm text-slate-400">Aucun produit ne correspond à la recherche.</p>}
      </div>

      <p className="text-xs text-slate-400">
        Gestion du catalogue (ajout, modification, images) désormais dans Réseau → Produits.
      </p>
    </div>
  )
}
