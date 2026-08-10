import { useEffect, useState } from 'react'
import { api } from '../api/client'
import StatCard from '../components/StatCard'
import { formatGNF } from '../lib/format'
import { useSecteurs } from '../lib/useSecteurs'
import type { DashboardConsolide } from '../types'

export default function Dashboard() {
  const [data, setData] = useState<DashboardConsolide | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { nomSecteur } = useSecteurs()

  useEffect(() => {
    api.dashboard().then(setData).catch((e) => setError(String(e)))
  }, [])

  if (error) return <div className="text-red-600">{error}</div>
  if (!data) return <div className="text-slate-400">Chargement…</div>

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
          <p className="text-sm text-slate-500">Vue consolidée du réseau KFSTORE</p>
        </div>
        <button className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Exporter (PDF/Excel)
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Chiffre d'affaires — jour" value={formatGNF(data.chiffre_affaires_jour)} />
        <StatCard label="Marge nette — jour" value={formatGNF(data.marge_nette_jour)} />
        <StatCard label="Dettes clients en cours" value={formatGNF(data.dettes_clients_en_cours)} />
        <StatCard label="Produits en alerte stock" value={String(data.produits_en_alerte_stock)} hint={`${data.boutiques_concernees_alerte} boutiques concernées`} />
        <StatCard label="Transferts en transit" value={String(data.transferts_en_transit)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">
            Comparatif par boutique — aujourd'hui
          </h2>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="pb-2 font-medium">Boutique</th>
                <th className="pb-2 font-medium">Secteur</th>
                <th className="pb-2 text-right font-medium">CA jour</th>
                <th className="pb-2 text-right font-medium">Stock alerte</th>
                <th className="pb-2 text-right font-medium">Dettes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.comparatif_boutiques.map((b) => (
                <tr key={b.boutique_id}>
                  <td className="py-2 font-medium text-slate-900">{b.nom}</td>
                  <td className="py-2 text-slate-500">{b.secteurs.map((s) => nomSecteur(s)).join(', ')}</td>
                  <td className="py-2 text-right text-slate-900">{formatGNF(b.ca_jour)}</td>
                  <td className={`py-2 text-right font-medium ${b.stock_en_alerte > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                    {b.stock_en_alerte}
                  </td>
                  <td className="py-2 text-right text-slate-900">{formatGNF(b.dettes_en_cours)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">Alertes réseau</h2>
          <ul className="space-y-3">
            {data.alertes.map((a, i) => (
              <li key={i} className="border-l-2 border-amber-400 pl-3">
                <div className="text-sm font-semibold text-slate-900">{a.titre}</div>
                <div className="text-xs text-slate-500">{a.description}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
