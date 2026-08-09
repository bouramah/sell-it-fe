import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import SearchableSelect from '../components/SearchableSelect'
import SearchInput from '../components/SearchInput'
import { useBoutiques } from '../lib/useBoutiques'
import { useSearch } from '../lib/useSearch'
import { STATUT_LIVRAISON_LABELS, type Livraison, type StatutLivraison } from '../types'

const STATUT_TONE: Record<StatutLivraison, 'default' | 'success' | 'warning' | 'danger'> = {
  preparee: 'default',
  en_cours: 'warning',
  livree: 'success',
  echec: 'danger',
}

export default function Livraisons() {
  const [livraisons, setLivraisons] = useState<Livraison[]>([])
  const [boutiqueId, setBoutiqueId] = useState('')
  const { boutiques, nomBoutique } = useBoutiques()

  useEffect(() => {
    api.livraisons().then(setLivraisons)
  }, [])

  const preFiltrees = boutiqueId ? livraisons.filter((l) => l.boutique_id === boutiqueId) : livraisons
  const getFields = useCallback((l: Livraison) => [l.commande_id, l.livreur, l.adresse], [])
  const { query, setQuery, filtered } = useSearch(preFiltrees, getFields)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Livraisons</h1>
          <p className="text-sm text-slate-500">Affectation des livreurs et suivi des tournées</p>
        </div>
        <button className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
          + Affecter une livraison
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Rechercher une livraison…" />
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
              <th className="px-4 py-3">Commande</th>
              <th className="px-4 py-3">Livreur</th>
              <th className="px-4 py-3">Boutique</th>
              <th className="px-4 py-3">Adresse / quartier</th>
              <th className="px-4 py-3">Créneau</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Preuve</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">#{l.commande_id}</td>
                <td className="px-4 py-3 text-slate-600">{l.livreur}</td>
                <td className="px-4 py-3 text-slate-600">{nomBoutique(l.boutique_id)}</td>
                <td className="px-4 py-3 text-slate-600">{l.adresse}</td>
                <td className="px-4 py-3 text-slate-500">{l.creneau}</td>
                <td className="px-4 py-3">
                  <Badge tone={STATUT_TONE[l.statut]}>{STATUT_LIVRAISON_LABELS[l.statut]}</Badge>
                </td>
                <td className="px-4 py-3">
                  {l.preuve_disponible ? (
                    <span className="text-teal-700 font-medium">Voir preuve</span>
                  ) : (
                    <span className="text-slate-400">Aucune preuve</span>
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
