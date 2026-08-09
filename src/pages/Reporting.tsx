import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { ReportingIntelligent } from '../types'

export default function Reporting() {
  const [data, setData] = useState<ReportingIntelligent | null>(null)

  useEffect(() => {
    api.reporting().then(setData)
  }, [])

  if (!data) return <div className="text-slate-400">Chargement…</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reporting intelligent</h1>
        <p className="text-sm text-slate-500">Synthèses automatiques et détection d'anomalies réseau</p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
          Synthèse automatique — semaine du 3 au 9 août
        </h2>
        <p className="text-sm leading-relaxed text-slate-700">{data.synthese}</p>
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-600">Anomalies détectées</h2>
        <p className="mb-3 text-xs text-slate-400">Écarts significatifs par rapport aux tendances habituelles, multi-boutiques.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {data.anomalies.map((a) => (
            <div key={a.id} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="text-sm font-semibold text-amber-900">{a.titre}</div>
              <div className="mt-1 text-xs text-amber-800">{a.description}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
