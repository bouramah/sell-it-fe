import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import SearchInput from '../components/SearchInput'
import { useSearch } from '../lib/useSearch'
import { SECTEUR_LABELS, type Fournisseur } from '../types'

export default function Fournisseurs() {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])

  useEffect(() => {
    api.fournisseurs().then(setFournisseurs)
  }, [])

  const getFields = useCallback((f: Fournisseur) => [f.nom, f.contact, f.conditions_paiement], [])
  const { query, setQuery, filtered } = useSearch(fournisseurs, getFields)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fournisseurs</h1>
          <p className="text-sm text-slate-500">Fiches fournisseurs et conditions commerciales</p>
        </div>
        <button className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
          + Ajouter un fournisseur
        </button>
      </div>

      <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un fournisseur…" />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Fournisseur</th>
              <th className="px-4 py-3">Secteur fourni</th>
              <th className="px-4 py-3">Conditions de paiement</th>
              <th className="px-4 py-3">Contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((f) => (
              <tr key={f.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{f.nom}</td>
                <td className="px-4 py-3">
                  <Badge>{SECTEUR_LABELS[f.secteur]}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-600">{f.conditions_paiement}</td>
                <td className="px-4 py-3 text-slate-600">{f.contact}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
