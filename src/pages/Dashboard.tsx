import { useEffect, useState } from 'react'
import { api } from '../api/client'
import StatCard from '../components/StatCard'
import { formatGNF } from '../lib/format'
import type { DashboardConsolide } from '../types'

export default function Dashboard() {
  const [data, setData] = useState<DashboardConsolide | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.dashboard().then(setData).catch((e) => setError(String(e)))
  }, [])

  if (error) return <div className="text-red-600">{error}</div>
  if (!data) return <div className="text-slate-400">Chargement…</div>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard consolidé</h1>
        <p className="text-sm text-slate-500">
          Vue d'ensemble du réseau — {data.nb_boutiques_actives} boutiques actives sur {data.nb_boutiques_total}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Chiffre d'affaires" value={formatGNF(data.chiffre_affaires)} hint="Mois en cours (simulé)" />
        <StatCard label="Marge" value={formatGNF(data.marge)} />
        <StatCard label="Stock valorisé" value={formatGNF(data.stock_total_valorise)} />
        <StatCard label="Dettes / créances" value={formatGNF(data.dettes_creances_en_cours)} />
        <StatCard label="Dépenses du mois" value={formatGNF(data.depenses_mois)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">
            Top boutiques (chiffre d'affaires)
          </h2>
          <ul className="space-y-3">
            {data.top_boutiques.map((b, i) => (
              <li key={b.boutique_id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-900">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-slate-900">{b.nom}</div>
                    <div className="text-xs text-slate-500">{b.ville}</div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-slate-900">{formatGNF(b.chiffre_affaires)}</div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">
            Alertes stock ({data.alertes_stock.length})
          </h2>
          {data.alertes_stock.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune alerte de stock actuellement.</p>
          ) : (
            <ul className="space-y-3">
              {data.alertes_stock.map((a, i) => (
                <li key={i} className="flex items-center justify-between rounded-md bg-amber-50 px-3 py-2">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{a.produit_nom}</div>
                    <div className="text-xs text-slate-500">{a.boutique_nom}</div>
                  </div>
                  <div className="text-sm font-semibold text-amber-700">
                    {a.quantite_disponible} / seuil {a.seuil_alerte}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
