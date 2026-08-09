import { useEffect, useState } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import { formatGNF, formatTime } from '../lib/format'
import { useBoutiques } from '../lib/useBoutiques'
import { STATUT_CAISSE_LABELS, type Caisse as CaisseEntity, type LigneMouvementCaisse, type StatutCaisse } from '../types'

const STATUT_TONE: Record<StatutCaisse, 'success' | 'default' | 'danger'> = {
  ouverte: 'success',
  fermee: 'default',
  ecart_signale: 'danger',
}

export default function Caisse() {
  const [caisses, setCaisses] = useState<CaisseEntity[]>([])
  const [mouvements, setMouvements] = useState<LigneMouvementCaisse[]>([])
  const { nomBoutique } = useBoutiques()

  useEffect(() => {
    api.caisses().then(setCaisses)
    api.mouvementsCaisse().then(setMouvements)
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Caisse / Point de vente</h1>
        <p className="text-sm text-slate-500">État des caisses et journal des mouvements du jour</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {caisses.map((c) => (
          <div key={c.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-slate-900">{c.libelle}</div>
              <Badge tone={STATUT_TONE[c.statut]}>{STATUT_CAISSE_LABELS[c.statut]}</Badge>
            </div>
            <div className="text-xs text-slate-500">{nomBoutique(c.boutique_id)} · {c.operateur}</div>
            <div className="mt-3 text-xs text-slate-500">Solde théorique</div>
            <div className="text-lg font-semibold text-slate-900">{formatGNF(c.solde_theorique)}</div>
            <div className="text-xs text-slate-500">Solde réel</div>
            <div className={`text-lg font-semibold ${c.solde_reel === c.solde_theorique ? 'text-slate-900' : 'text-red-600'}`}>
              {formatGNF(c.solde_reel)}
            </div>
            <button className="mt-3 w-full rounded-md border border-slate-300 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
              {c.statut === 'ouverte' ? 'Fermer la caisse' : 'Rouvrir la caisse'}
            </button>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
          Journal des mouvements de caisse — aujourd'hui
        </h2>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Heure</th>
                <th className="px-4 py-3">Boutique / Caisse</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Motif</th>
                <th className="px-4 py-3">Opérateur</th>
                <th className="px-4 py-3 text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mouvements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{formatTime(m.horodatage)}</td>
                  <td className="px-4 py-3 text-slate-600">{nomBoutique(m.boutique_id)} — {m.caisse_libelle}</td>
                  <td className="px-4 py-3">
                    <Badge tone={m.type === 'encaissement' ? 'success' : 'default'}>
                      {m.type === 'encaissement' ? 'Encaissement' : 'Décaissement'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{m.motif}</td>
                  <td className="px-4 py-3 text-slate-600">{m.operateur}</td>
                  <td className={`px-4 py-3 text-right font-medium ${m.montant >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {m.montant >= 0 ? `+${formatGNF(m.montant)}` : `-${formatGNF(Math.abs(m.montant))}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
