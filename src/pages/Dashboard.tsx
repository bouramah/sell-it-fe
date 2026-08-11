import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import GuineaMap from '../components/GuineaMap'
import StatCard from '../components/StatCard'
import { formatGNF } from '../lib/format'
import { PRESET_LABELS, periodFromPreset, type PeriodPreset } from '../lib/dashboardPeriod'
import { useSecteurs } from '../lib/useSecteurs'
import { CANAL_LABELS, MODE_PAIEMENT_LABELS, type DashboardConsolide, type DashboardKpis } from '../types'

const PRESETS: PeriodPreset[] = ['heure', '24h', '7j', '31j', 'personnalise']

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardConsolide | null>(null)
  const [kpis, setKpis] = useState<DashboardKpis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { nomSecteur } = useSecteurs()

  const [preset, setPreset] = useState<PeriodPreset>('24h')
  const [customDebut, setCustomDebut] = useState(todayIso())
  const [customFin, setCustomFin] = useState(todayIso())

  const period = useMemo(() => periodFromPreset(preset, customDebut, customFin), [preset, customDebut, customFin])

  useEffect(() => {
    api.dashboard().then(setData).catch((e) => setError(String(e)))
  }, [])

  useEffect(() => {
    api.dashboardKpis(period.debut, period.fin).then(setKpis).catch((e) => setError(String(e)))
  }, [period.debut, period.fin])

  if (error) return <div className="text-red-600">{error}</div>
  if (!data || !kpis) return <div className="text-slate-400">Chargement…</div>

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

      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setPreset(p)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              preset === p ? 'bg-teal-700 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {PRESET_LABELS[p]}
          </button>
        ))}
        {preset === 'personnalise' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customDebut}
              onChange={(e) => setCustomDebut(e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
            <span className="text-slate-400">→</span>
            <input
              type="date"
              value={customFin}
              onChange={(e) => setCustomFin(e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
        )}
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Ventes — période sélectionnée</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Chiffre d'affaires" value={formatGNF(kpis.ventes.chiffre_affaires)} />
          <StatCard label="Commandes" value={String(kpis.ventes.nombre_commandes)} />
          <StatCard label="Panier moyen" value={formatGNF(kpis.ventes.panier_moyen)} />
          <StatCard label="Encaissements caisse" value={formatGNF(kpis.caisse.encaissements)} />
          <StatCard label="Flux net caisse" value={formatGNF(kpis.caisse.flux_net)} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Stock &amp; finance</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Entrées de stock" value={String(kpis.stock.entrees)} />
          <StatCard label="Sorties de stock" value={String(kpis.stock.sorties)} />
          <StatCard label="Dépenses" value={formatGNF(kpis.finance.depenses)} />
          <StatCard label="Marge nette" value={formatGNF(kpis.finance.marge_nette)} />
          <StatCard label="Dettes clients en cours" value={formatGNF(kpis.finance.dettes_clients_en_cours)} hint="Solde actuel, hors période" />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">Répartition des ventes</h2>
          <div className="space-y-4">
            <div>
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Par canal</div>
              {kpis.ventes.par_canal.length === 0 && <p className="text-sm text-slate-400">Aucune vente sur la période.</p>}
              {kpis.ventes.par_canal.map((c) => (
                <div key={c.canal} className="flex items-center justify-between border-b border-slate-100 py-1.5 text-sm">
                  <span className="text-slate-600">
                    {CANAL_LABELS[c.canal]} <span className="text-slate-400">({c.nombre})</span>
                  </span>
                  <span className="font-medium text-slate-900">{formatGNF(c.montant)}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Par mode de paiement</div>
              {kpis.ventes.par_mode_paiement.length === 0 && <p className="text-sm text-slate-400">Aucune vente sur la période.</p>}
              {kpis.ventes.par_mode_paiement.map((m) => (
                <div key={m.mode} className="flex items-center justify-between border-b border-slate-100 py-1.5 text-sm">
                  <span className="text-slate-600">{MODE_PAIEMENT_LABELS[m.mode]}</span>
                  <span className="font-medium text-slate-900">{formatGNF(m.montant)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">Top produits &amp; boutiques</h2>
          <div className="space-y-4">
            <div>
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Top produits</div>
              {kpis.ventes.top_produits.length === 0 && <p className="text-sm text-slate-400">Aucune vente sur la période.</p>}
              {kpis.ventes.top_produits.map((p) => (
                <div key={p.produit_id} className="flex items-center justify-between border-b border-slate-100 py-1.5 text-sm">
                  <span className="text-slate-600">
                    {p.produit_nom} <span className="text-slate-400">×{p.quantite}</span>
                  </span>
                  <span className="font-medium text-slate-900">{formatGNF(p.montant)}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Top boutiques</div>
              {kpis.ventes.top_boutiques.length === 0 && <p className="text-sm text-slate-400">Aucune vente sur la période.</p>}
              {kpis.ventes.top_boutiques.map((b) => (
                <div key={b.boutique_id} className="flex items-center justify-between border-b border-slate-100 py-1.5 text-sm">
                  <span className="text-slate-600">{b.nom}</span>
                  <span className="font-medium text-slate-900">{formatGNF(b.montant)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-600">Réseau de boutiques — Guinée</h2>
        <p className="mb-4 text-xs text-slate-400">
          Taille du marqueur = CA sur la période · orange = alerte stock en cours. Carte illustrative, pas une frontière officielle.
        </p>
        <GuineaMap boutiques={kpis.boutiques} />
      </section>

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
            {data.alertes.length === 0 && <p className="text-sm text-slate-400">Aucune alerte en cours.</p>}
          </ul>
        </section>
      </div>
    </div>
  )
}
