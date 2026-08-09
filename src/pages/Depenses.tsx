import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import SearchableSelect from '../components/SearchableSelect'
import SearchInput from '../components/SearchInput'
import { formatGNF, formatShortDate } from '../lib/format'
import { useBoutiques } from '../lib/useBoutiques'
import { useSearch } from '../lib/useSearch'
import { STATUT_VALIDATION_DEPENSE_LABELS, type Depense, type StatutValidationDepense } from '../types'

const STATUT_TONE: Record<StatutValidationDepense, 'success' | 'warning'> = {
  auto_validee: 'success',
  en_attente: 'warning',
  validee_siege: 'success',
}

export default function Depenses() {
  const [depenses, setDepenses] = useState<Depense[]>([])
  const [boutiqueId, setBoutiqueId] = useState('')
  const { boutiques, nomBoutique } = useBoutiques()

  useEffect(() => {
    api.depenses().then(setDepenses)
  }, [])

  const preFiltrees = boutiqueId ? depenses.filter((d) => d.boutique_id === boutiqueId) : depenses
  const getFields = useCallback((d: Depense) => [d.categorie, d.auteur], [])
  const { query, setQuery, filtered } = useSearch(preFiltrees, getFields)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dépenses</h1>
          <p className="text-sm text-slate-500">Dépenses de boutique et circuit de validation</p>
        </div>
        <button className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
          + Enregistrer une dépense
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Rechercher une dépense…" />
        <div className="w-56">
          <SearchableSelect
            value={boutiqueId}
            onChange={setBoutiqueId}
            options={boutiques.map((b) => ({ value: b.id, label: b.nom }))}
            allowEmpty="Toutes les boutiques"
            placeholder="Toutes les boutiques"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Boutique</th>
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3">Auteur</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Montant</th>
              <th className="px-4 py-3">Validation</th>
              <th className="px-4 py-3">Justificatif</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-600">{nomBoutique(d.boutique_id)}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{d.categorie}</td>
                <td className="px-4 py-3 text-slate-600">{d.auteur}</td>
                <td className="px-4 py-3 text-slate-500">{formatShortDate(d.date)}</td>
                <td className="px-4 py-3 text-right text-slate-900">{formatGNF(d.montant)}</td>
                <td className="px-4 py-3">
                  <Badge tone={STATUT_TONE[d.statut_validation]}>{STATUT_VALIDATION_DEPENSE_LABELS[d.statut_validation]}</Badge>
                </td>
                <td className="px-4 py-3">
                  {d.justificatif_disponible ? (
                    <span className="text-teal-700 font-medium">Voir justificatif</span>
                  ) : (
                    <span className="text-slate-400">Aucun justificatif</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
