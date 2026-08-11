import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import BarChartHorizontal from '../components/charts/BarChartHorizontal'
import DonutChart from '../components/charts/DonutChart'
import LineAreaChart from '../components/charts/LineAreaChart'
import GuineaMap from '../components/GuineaMap'
import SearchableSelect from '../components/SearchableSelect'
import StatCard from '../components/StatCard'
import { formatGNF, formatGNFCompact } from '../lib/format'
import { PRESET_LABELS, periodFromPreset, type PeriodPreset } from '../lib/dashboardPeriod'
import { exportDashboardCsv } from '../lib/exportDashboard'
import { useBoutiques } from '../lib/useBoutiques'
import { useSecteurs } from '../lib/useSecteurs'
import { CANAL_LABELS, MODE_PAIEMENT_LABELS, type DashboardConsolide, type DashboardKpis } from '../types'

const PRESETS: PeriodPreset[] = ['heure', '24h', '7j', '31j', 'personnalise']

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function formatSeriePoint(iso: string, parHeure: boolean): string {
  const d = new Date(iso)
  return parHeure
    ? new Intl.DateTimeFormat('fr-FR', { hour: '2-digit' }).format(d)
    : new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(d)
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardConsolide | null>(null)
  const [kpis, setKpis] = useState<DashboardKpis | null>(null)
  const [denied, setDenied] = useState(false)
  const { nomSecteur } = useSecteurs()
  const { boutiques } = useBoutiques()

  const [preset, setPreset] = useState<PeriodPreset>('24h')
  const [customDebut, setCustomDebut] = useState(todayIso())
  const [customFin, setCustomFin] = useState(todayIso())
  const [boutiqueId, setBoutiqueId] = useState('')

  const period = useMemo(() => periodFromPreset(preset, customDebut, customFin), [preset, customDebut, customFin])

  useEffect(() => {
    // Vue consolidée réseau — réservée au siège (responsable achats / administrateur) ; les autres
    // rôles n'ont accès qu'à leurs KPIs de boutique ci-dessous, ce qui est attendu (403 silencieux).
    api.dashboard().then(setData).catch(() => setData(null))
  }, [])

  useEffect(() => {
    // Le dashboard (même KPIs de boutique) est réservé à gérant/responsable achats/administrateur
    // (CDC 3.3 : vendeur/caissier n'y ont pas accès du tout).
    api.dashboardKpis(period.debut, period.fin, boutiqueId || undefined).then(setKpis).catch(() => setDenied(true))
  }, [period.debut, period.fin, boutiqueId])

  if (denied) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        Le tableau de bord est réservé au gérant, au responsable achats et à l'administrateur.
      </div>
    )
  }
  if (!kpis) return <div className="text-slate-400">Chargement…</div>

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
          <p className="text-sm text-slate-500">
            {data ? 'Vue consolidée du réseau KFSTORE' : 'Vue de votre / vos boutique(s)'}
          </p>
        </div>
        <button
          onClick={() => exportDashboardCsv(kpis, PRESET_LABELS[preset])}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Exporter (Excel)
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
        <div className="w-56">
          <SearchableSelect
            value={boutiqueId}
            onChange={setBoutiqueId}
            options={boutiques.map((b) => ({ value: b.id, label: b.nom }))}
            allowEmpty="Toutes les boutiques"
            placeholder="Toutes les boutiques"
          />
        </div>
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

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">
          Évolution du chiffre d'affaires
        </h2>
        <LineAreaChart
          data={kpis.serie_ventes.map((p) => ({ label: p.horodatage, value: p.chiffre_affaires }))}
          valueFormatter={formatGNFCompact}
          labelFormatter={(l) => formatSeriePoint(l, preset === 'heure' || preset === '24h')}
        />
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
          <div className="space-y-5">
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Par canal</div>
              <DonutChart
                data={kpis.ventes.par_canal.map((c) => ({ label: CANAL_LABELS[c.canal], value: c.montant }))}
                valueFormatter={formatGNFCompact}
              />
            </div>
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Par mode de paiement</div>
              <DonutChart
                data={kpis.ventes.par_mode_paiement.map((m) => ({ label: MODE_PAIEMENT_LABELS[m.mode], value: m.montant }))}
                valueFormatter={formatGNFCompact}
              />
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">Top produits &amp; boutiques</h2>
          <div className="space-y-5">
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Top produits</div>
              <BarChartHorizontal
                data={kpis.ventes.top_produits.map((p) => ({ label: p.produit_nom, sublabel: `×${p.quantite}`, value: p.montant }))}
                valueFormatter={formatGNFCompact}
              />
            </div>
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Top boutiques</div>
              <BarChartHorizontal
                data={kpis.ventes.top_boutiques.map((b) => ({ label: b.nom, value: b.montant }))}
                valueFormatter={formatGNFCompact}
              />
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-600">Réseau de boutiques — Guinée</h2>
        <p className="mb-4 text-xs text-slate-400">
          Taille du marqueur = CA sur la période · orange = alerte stock en cours. Cliquez un marqueur pour les détails.
        </p>
        <GuineaMap boutiques={kpis.boutiques} />
      </section>

      {data && (
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
      )}
    </div>
  )
}
