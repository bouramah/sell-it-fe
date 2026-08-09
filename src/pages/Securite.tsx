import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { formatDate } from '../lib/format'
import { useBoutiques } from '../lib/useBoutiques'
import type { JournalAuditEntry, ParametreSecurite } from '../types'

export default function Securite() {
  const [audit, setAudit] = useState<JournalAuditEntry[]>([])
  const [parametres, setParametres] = useState<ParametreSecurite[]>([])
  const { nomBoutique } = useBoutiques()

  useEffect(() => {
    api.audit().then(setAudit)
    api.parametresSecurite().then(setParametres)
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sécurité & audit</h1>
        <p className="text-sm text-slate-500">Journal d'audit et paramètres de sécurité</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Journal d'audit</h2>
          <p className="mb-4 text-xs text-slate-400">
            Écriture seule — aucune suppression ni modification a posteriori possible, y compris par un administrateur.
          </p>
          <ul className="space-y-3">
            {audit.map((a) => (
              <li key={a.id} className="border-l-2 border-slate-200 pl-3">
                <div className="text-xs text-slate-400">{formatDate(a.horodatage)}</div>
                <div className="text-sm font-medium text-slate-900">{a.action}</div>
                <div className="text-xs text-slate-500">
                  {a.auteur} · {a.boutique_id ? nomBoutique(a.boutique_id) : 'Siège'}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">Paramètres de sécurité</h2>
          <ul className="space-y-3">
            {parametres.map((p) => (
              <li key={p.label} className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm">
                <span className="text-slate-700">{p.label}</span>
                <span
                  className={`inline-block h-5 w-9 rounded-full transition-colors ${p.actif ? 'bg-teal-700' : 'bg-slate-300'}`}
                >
                  <span
                    className={`block h-4 w-4 translate-y-0.5 rounded-full bg-white transition-transform ${
                      p.actif ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
