import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, SERVER_BASE } from '../api/client'
import Badge from '../components/Badge'
import { SpinnerBloc } from '../components/Spinner'
import { formatGNF } from '../lib/format'
import { useSecteurs } from '../lib/useSecteurs'
import type { ProduitRecommande } from '../types'

function CarteProduit({ p }: { p: ProduitRecommande }) {
  const { nomSecteur } = useSecteurs()
  return (
    <Link
      to={`/produits/${p.id}`}
      className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-teal-300"
    >
      <div className="mb-3 flex h-24 items-center justify-center overflow-hidden rounded-md bg-slate-100">
        {p.images[0] ? (
          <img src={`${SERVER_BASE}${p.images[0]}`} alt={p.nom} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-slate-400">photo produit</span>
        )}
      </div>
      <div className="text-sm font-medium text-slate-900">{p.nom}</div>
      <div className="mt-1 flex items-center gap-1.5">
        <Badge>{nomSecteur(p.secteur)}</Badge>
        <span className="text-[11px] text-teal-700">{p.raison}</span>
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-sm font-semibold text-slate-900">{formatGNF(p.prix_detail)}</span>
        <span className={`text-xs ${p.disponible > 0 ? 'text-slate-400' : 'text-red-500'}`}>
          {p.disponible > 0 ? `${p.disponible} dispo.` : 'Rupture'}
        </span>
      </div>
    </Link>
  )
}

export default function Catalogue() {
  const [q, setQ] = useState('')
  const [resultats, setResultats] = useState<ProduitRecommande[]>([])
  const [tendances, setTendances] = useState<ProduitRecommande[]>([])
  const [chercheEffectuee, setChercheEffectuee] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.iaTendances().then(setTendances).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!q.trim()) {
      setResultats([])
      setChercheEffectuee(false)
      return
    }
    const handle = setTimeout(() => {
      api.iaRecherche(q.trim()).then((r) => {
        setResultats(r)
        setChercheEffectuee(true)
      })
    }, 250)
    return () => clearTimeout(handle)
  }, [q])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Catalogue & recherche IA</h1>
        <p className="text-sm text-slate-500">Recherche tolérante aux fautes, recommandations et tendances</p>
      </div>

      <div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Recherche IA — tolérante aux fautes de frappe…"
          className="w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {chercheEffectuee && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Résultats</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {resultats.map((p) => (
              <CarteProduit key={p.id} p={p} />
            ))}
          </div>
          {resultats.length === 0 && <p className="text-sm text-slate-400">Aucun produit ne correspond à la recherche.</p>}
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Tendances du réseau (30 derniers jours)</h2>
        {loading && tendances.length === 0 ? (
          <SpinnerBloc />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {tendances.map((p) => (
              <CarteProduit key={p.id} p={p} />
            ))}
            {tendances.length === 0 && <p className="text-sm text-slate-400">Pas encore assez de ventes pour dégager une tendance.</p>}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400">
        Gestion du catalogue (ajout, modification, images) désormais dans Réseau → Produits.
      </p>
    </div>
  )
}
