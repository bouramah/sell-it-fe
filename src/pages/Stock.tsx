import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import SearchableSelect from '../components/SearchableSelect'
import SearchInput from '../components/SearchInput'
import Tabs from '../components/Tabs'
import { formatDate } from '../lib/format'
import { useBoutiques } from '../lib/useBoutiques'
import { useSearch } from '../lib/useSearch'
import {
  MOTIF_MOUVEMENT_LABELS,
  type LigneEcartInventaire,
  type LigneMouvementStock,
  type LigneStock,
  type StatutEcartInventaire,
  type StatutStock,
} from '../types'

const STATUT_STOCK_TONE: Record<StatutStock, 'danger' | 'warning' | 'success'> = {
  critique: 'danger',
  a_surveiller: 'warning',
  correct: 'success',
}
const STATUT_STOCK_LABELS: Record<StatutStock, string> = {
  critique: 'Critique',
  a_surveiller: 'À surveiller',
  correct: 'Correct',
}

const ECART_TONE: Record<StatutEcartInventaire, 'success' | 'warning' | 'danger'> = {
  conforme: 'success',
  corrige: 'warning',
  a_investiguer: 'danger',
}
const ECART_LABELS: Record<StatutEcartInventaire, string> = {
  conforme: 'Conforme',
  corrige: 'Corrigé',
  a_investiguer: 'Écart à investiguer',
}

export default function Stock() {
  const [vue, setVue] = useState<'etat' | 'historique'>('etat')
  const [boutiqueId, setBoutiqueId] = useState('')
  const [lignes, setLignes] = useState<LigneStock[]>([])
  const [mouvements, setMouvements] = useState<LigneMouvementStock[]>([])
  const [ecarts, setEcarts] = useState<LigneEcartInventaire[]>([])
  const { boutiques, nomBoutique } = useBoutiques()

  useEffect(() => {
    api.stock(boutiqueId || undefined).then(setLignes)
  }, [boutiqueId])

  useEffect(() => {
    if (vue === 'historique') {
      api.mouvementsStock(boutiqueId || undefined).then(setMouvements)
      api.inventaire(boutiqueId || undefined).then(setEcarts)
    }
  }, [vue, boutiqueId])

  const getLigneFields = useCallback((l: LigneStock) => [l.produit_nom, nomBoutique(l.boutique_id)], [nomBoutique])
  const { query: ligneQuery, setQuery: setLigneQuery, filtered: filteredLignes } = useSearch(lignes, getLigneFields)

  const getMouvementFields = useCallback(
    (m: LigneMouvementStock) => [m.produit_nom, nomBoutique(m.boutique_id), m.operateur, MOTIF_MOUVEMENT_LABELS[m.motif]],
    [nomBoutique]
  )
  const { query: mvtQuery, setQuery: setMvtQuery, filtered: filteredMouvements } = useSearch(mouvements, getMouvementFields)

  const getEcartFields = useCallback((e: LigneEcartInventaire) => [e.produit_nom, nomBoutique(e.boutique_id)], [nomBoutique])
  const { query: ecartQuery, setQuery: setEcartQuery, filtered: filteredEcarts } = useSearch(ecarts, getEcartFields)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestion des stocks</h1>
          <p className="text-sm text-slate-500">Suivi des quantités par boutique et par produit</p>
        </div>
        <button className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
          + Ajouter un produit en stock
        </button>
      </div>

      <div className="flex items-center justify-between">
        <Tabs
          tabs={[
            { key: 'etat', label: 'État actuel' },
            { key: 'historique', label: 'Historique & inventaire' },
          ]}
          active={vue}
          onChange={(k) => setVue(k as 'etat' | 'historique')}
        />
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

      {vue === 'etat' ? (
        <div className="space-y-3">
        <SearchInput value={ligneQuery} onChange={setLigneQuery} placeholder="Rechercher un produit…" />
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Produit</th>
                <th className="px-4 py-3">Boutique</th>
                <th className="px-4 py-3 text-right">Disponible</th>
                <th className="px-4 py-3 text-right">Réservé</th>
                <th className="px-4 py-3 text-right">Seuil d'alerte</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLignes.map((l) => (
                <tr key={`${l.boutique_id}-${l.produit_id}`} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{l.produit_nom}</td>
                  <td className="px-4 py-3 text-slate-600">{nomBoutique(l.boutique_id)}</td>
                  <td className="px-4 py-3 text-right">{l.quantite_disponible}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{l.quantite_reservee}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{l.seuil_alerte}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUT_STOCK_TONE[l.statut]}>{STATUT_STOCK_LABELS[l.statut]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      ) : (
        <div className="space-y-6">
          <section>
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-600">
              Journal des mouvements de stock
            </h2>
            <p className="mb-3 text-xs text-slate-400">
              Chaque mouvement est rattaché à un motif obligatoire, une boutique et un opérateur.
            </p>
            <div className="mb-3">
              <SearchInput value={mvtQuery} onChange={setMvtQuery} placeholder="Rechercher un mouvement…" />
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Produit</th>
                    <th className="px-4 py-3">Boutique</th>
                    <th className="px-4 py-3">Motif</th>
                    <th className="px-4 py-3">Opérateur</th>
                    <th className="px-4 py-3 text-right">Quantité</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMouvements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500">{formatDate(m.horodatage)}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{m.produit_nom}</td>
                      <td className="px-4 py-3 text-slate-600">{nomBoutique(m.boutique_id)}</td>
                      <td className="px-4 py-3 text-slate-600">{MOTIF_MOUVEMENT_LABELS[m.motif]}</td>
                      <td className="px-4 py-3 text-slate-600">{m.operateur}</td>
                      <td className={`px-4 py-3 text-right font-medium ${m.quantite >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {m.quantite >= 0 ? `+${m.quantite}` : m.quantite}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
              Rapprochement d'inventaire — stock théorique vs réel
            </h2>
            <div className="mb-3">
              <SearchInput value={ecartQuery} onChange={setEcartQuery} placeholder="Rechercher un produit…" />
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Produit</th>
                    <th className="px-4 py-3">Boutique</th>
                    <th className="px-4 py-3 text-right">Théorique</th>
                    <th className="px-4 py-3 text-right">Réel</th>
                    <th className="px-4 py-3 text-right">Écart</th>
                    <th className="px-4 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEcarts.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{e.produit_nom}</td>
                      <td className="px-4 py-3 text-slate-600">{nomBoutique(e.boutique_id)}</td>
                      <td className="px-4 py-3 text-right">{e.theorique}</td>
                      <td className="px-4 py-3 text-right">{e.reel}</td>
                      <td className={`px-4 py-3 text-right font-medium ${e.ecart === 0 ? 'text-slate-400' : 'text-red-600'}`}>
                        {e.ecart}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={ECART_TONE[e.statut]}>{ECART_LABELS[e.statut]}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
