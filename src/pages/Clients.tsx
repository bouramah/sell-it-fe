import { useEffect, useState } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import { formatGNF } from '../lib/format'
import { useBoutiques } from '../lib/useBoutiques'
import { SEGMENT_LABELS, type Client, type SegmentClient } from '../types'

const SEGMENT_TONE: Record<SegmentClient, 'default' | 'success' | 'warning' | 'danger'> = {
  nouveau: 'default',
  regulier: 'default',
  fidele: 'success',
  a_risque: 'danger',
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const { nomBoutique } = useBoutiques()

  useEffect(() => {
    api.clients().then(setClients)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-sm text-slate-500">Fiche client, historique et droit de crédit</p>
        </div>
        <button className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
          + Ajouter un client
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Boutique fréquentée</th>
              <th className="px-4 py-3">Segment</th>
              <th className="px-4 py-3">Crédit autorisé</th>
              <th className="px-4 py-3 text-right">Solde dette</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{c.nom}</td>
                <td className="px-4 py-3 text-slate-600">{c.contact}</td>
                <td className="px-4 py-3 text-slate-600">{nomBoutique(c.boutique_id)}</td>
                <td className="px-4 py-3">
                  <Badge tone={SEGMENT_TONE[c.segment]}>{SEGMENT_LABELS[c.segment]}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={c.credit_autorise ? 'success' : 'default'}>{c.credit_autorise ? 'Oui' : 'Non'}</Badge>
                </td>
                <td className="px-4 py-3 text-right text-slate-900">{formatGNF(c.solde_dette)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
