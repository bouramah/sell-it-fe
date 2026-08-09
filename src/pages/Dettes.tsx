import { useEffect, useState } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import StatCard from '../components/StatCard'
import Tabs from '../components/Tabs'
import { formatGNF, formatShortDate } from '../lib/format'
import { useBoutiques } from '../lib/useBoutiques'
import { STATUT_DETTE_LABELS, type LigneDette, type StatutDette, type TiersType } from '../types'

const STATUT_TONE: Record<StatutDette, 'success' | 'warning' | 'danger'> = {
  en_cours: 'warning',
  en_retard: 'danger',
  soldee: 'success',
}

export default function Dettes() {
  const [tiers, setTiers] = useState<TiersType>('client')
  const [dettes, setDettes] = useState<LigneDette[]>([])
  const [boutiqueId, setBoutiqueId] = useState('')
  const { boutiques, nomBoutique } = useBoutiques()

  useEffect(() => {
    api.dettes(tiers).then(setDettes)
  }, [tiers])

  const filtrees = boutiqueId ? dettes.filter((d) => d.boutique_id === boutiqueId) : dettes
  const totalRestant = filtrees.reduce((sum, d) => sum + d.solde_restant, 0)
  const enRetard = filtrees.filter((d) => d.statut === 'en_retard').length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dettes & créances</h1>
          <p className="text-sm text-slate-500">
            {tiers === 'client' ? 'Suivi des impayés clients par boutique' : 'Suivi des dettes envers les fournisseurs'}
          </p>
        </div>
        <button className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
          + Enregistrer une dette
        </button>
      </div>

      <div className="flex items-center justify-between">
        <Tabs
          tabs={[
            { key: 'client', label: 'Créances clients' },
            { key: 'fournisseur', label: 'Dettes fournisseurs' },
          ]}
          active={tiers}
          onChange={(k) => setTiers(k as TiersType)}
        />
        <select
          value={boutiqueId}
          onChange={(e) => setBoutiqueId(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        >
          <option value="">Toutes les boutiques</option>
          {boutiques.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nom}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={tiers === 'client' ? 'Total créances en cours' : 'Total dû aux fournisseurs'} value={formatGNF(totalRestant)} />
        <StatCard label="Échéances dépassées" value={`${enRetard} ${tiers === 'client' ? 'clients' : 'fournisseurs'}`} />
        <StatCard label={tiers === 'client' ? 'Comptes concernés' : 'Fournisseurs concernés'} value={String(new Set(filtrees.map((d) => d.tiers_nom)).size)} />
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">{tiers === 'client' ? 'Client' : 'Fournisseur'}</th>
              <th className="px-4 py-3">Boutique</th>
              <th className="px-4 py-3 text-right">Montant initial</th>
              <th className="px-4 py-3 text-right">Solde restant</th>
              <th className="px-4 py-3">Échéance</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtrees.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{d.tiers_nom}</td>
                <td className="px-4 py-3 text-slate-600">{nomBoutique(d.boutique_id)}</td>
                <td className="px-4 py-3 text-right text-slate-600">{formatGNF(d.montant_initial)}</td>
                <td className="px-4 py-3 text-right font-medium text-slate-900">{formatGNF(d.solde_restant)}</td>
                <td className="px-4 py-3 text-slate-500">{formatShortDate(d.echeance)}</td>
                <td className="px-4 py-3">
                  <Badge tone={STATUT_TONE[d.statut]}>{STATUT_DETTE_LABELS[d.statut]}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
