import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import SearchInput from '../components/SearchInput'
import StatCard from '../components/StatCard'
import { formatGNF } from '../lib/format'
import { useBoutiques } from '../lib/useBoutiques'
import { useSearch } from '../lib/useSearch'
import type { ComptabiliteConsolidee, CompteResultatBoutique } from '../types'

export default function Comptabilite() {
  const [data, setData] = useState<ComptabiliteConsolidee | null>(null)
  const { nomBoutique } = useBoutiques()

  useEffect(() => {
    api.comptabilite().then(setData)
  }, [])

  const getFields = useCallback((c: CompteResultatBoutique) => [nomBoutique(c.boutique_id)], [nomBoutique])
  const { query, setQuery, filtered } = useSearch(data?.comptes ?? [], getFields)

  if (!data) return <div className="text-slate-400">Chargement…</div>

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Comptabilité</h1>
          <p className="text-sm text-slate-500">Résultats par boutique et consolidation réseau</p>
        </div>
        <button className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Exporter (PDF/Excel)
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="CA consolidé — cumulé" value={formatGNF(data.ca_consolide)} />
        <StatCard label="Marge nette consolidée" value={formatGNF(data.marge_nette_consolidee)} />
        <StatCard label="Dépenses consolidées" value={formatGNF(data.depenses_consolidees)} />
        <StatCard label="Marge nette moyenne" value={`${data.marge_nette_moyenne_pct} %`} />
      </div>

      <section>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-600">
          Compte de résultat par boutique — cumulé depuis le début
        </h2>
        <p className="mb-3 text-xs text-slate-400">
          Calculé en temps réel à partir des commandes, réceptions fournisseurs et dépenses enregistrées — non modifiable
        </p>
        <div className="mb-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Rechercher une boutique…" />
        </div>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Boutique</th>
                <th className="px-4 py-3 text-right">Chiffre d'affaires</th>
                <th className="px-4 py-3 text-right">Achats</th>
                <th className="px-4 py-3 text-right">Dépenses</th>
                <th className="px-4 py-3 text-right">Marge nette</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr key={c.boutique_id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{nomBoutique(c.boutique_id)}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{formatGNF(c.chiffre_affaires)}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{formatGNF(c.achats)}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{formatGNF(c.depenses)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${c.marge_nette < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                    {formatGNF(c.marge_nette)}
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
