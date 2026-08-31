import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import Badge from '../components/Badge'
import Pagination from '../components/Pagination'
import SearchInput from '../components/SearchInput'
import { SpinnerBloc } from '../components/Spinner'
import { useBoutiques } from '../lib/useBoutiques'
import { usePagination } from '../lib/usePagination'
import { useSearch } from '../lib/useSearch'
import type { SuggestionAvecProduit } from '../types'

const CONFIANCE_TONE = { faible: 'warning', moyenne: 'default', haute: 'success' } as const
const CONFIANCE_LABEL = { faible: 'Faible — historique court', moyenne: 'Moyenne', haute: 'Haute' } as const

export default function Previsions() {
  const [suggestions, setSuggestions] = useState<SuggestionAvecProduit[]>([])
  const [loading, setLoading] = useState(true)
  const { nomBoutique } = useBoutiques()
  const navigate = useNavigate()

  function creerCommande(s: SuggestionAvecProduit) {
    navigate('/commandes-fournisseurs', {
      state: { prefill: { boutique_id: s.boutique_id, produit_id: s.produit_id, quantite: s.quantite_suggeree } },
    })
  }

  useEffect(() => {
    api.previsions().then(setSuggestions).finally(() => setLoading(false))
  }, [])

  const getFields = useCallback((s: SuggestionAvecProduit) => [s.produit_nom, nomBoutique(s.boutique_id)], [nomBoutique])
  const { query, setQuery, filtered } = useSearch(suggestions, getFields)
  const { page, setPage, pageCount, paginated, totalItems, pageSize } = usePagination(filtered)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Prévisions de demande</h1>
        <p className="text-sm text-slate-500">Suggestions de réapprovisionnement par boutique et produit</p>
      </div>

      <section className="rounded-lg border border-teal-100 bg-teal-50/50 p-4">
        <h2 className="text-sm font-semibold text-teal-900">IA — Prévision de la demande</h2>
        <p className="text-sm text-teal-800">
          Suggestions de réapprovisionnement basées sur la vitesse de vente réelle de chaque produit, par boutique.
          La confiance reflète la profondeur d'historique disponible — elle s'améliore avec l'usage.
        </p>
      </section>

      <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un produit…" />

      {loading && suggestions.length === 0 ? (
        <SpinnerBloc />
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Produit</th>
                <th className="px-4 py-3">Boutique</th>
                <th className="px-4 py-3 text-right">Stock actuel</th>
                <th className="px-4 py-3 text-right">Ventes prévues (14j)</th>
                <th className="px-4 py-3 text-right">Quantité suggérée</th>
                <th className="px-4 py-3">Confiance</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((s) => (
                <tr key={`${s.produit_id}-${s.boutique_id}`} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{s.produit_nom}</td>
                  <td className="px-4 py-3 text-slate-600">{nomBoutique(s.boutique_id)}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{s.stock_actuel}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{s.ventes_prevues_14j}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">{s.quantite_suggeree} unités</td>
                  <td className="px-4 py-3">
                    <Badge tone={CONFIANCE_TONE[s.confiance]}>{CONFIANCE_LABEL[s.confiance]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => creerCommande(s)} className="text-sm font-medium text-teal-700 hover:underline">
                      Créer commande fournisseur
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} pageCount={pageCount} onChange={setPage} totalItems={totalItems} pageSize={pageSize} />
        </div>
      )}
    </div>
  )
}
