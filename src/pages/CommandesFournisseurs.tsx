import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import SearchableSelect from '../components/SearchableSelect'
import SearchInput from '../components/SearchInput'
import { formatGNF, formatShortDate } from '../lib/format'
import { useBoutiques } from '../lib/useBoutiques'
import { useSearch } from '../lib/useSearch'
import {
  STATUT_COMMANDE_FOURNISSEUR_LABELS,
  type Fournisseur,
  type LigneCommandeFournisseur,
  type StatutCommandeFournisseur,
} from '../types'

const STATUT_TONE: Record<StatutCommandeFournisseur, 'default' | 'success' | 'warning'> = {
  brouillon: 'warning',
  validee: 'default',
  envoyee: 'default',
  receptionnee_partielle: 'warning',
  receptionnee: 'success',
  cloturee: 'success',
}

export default function CommandesFournisseurs() {
  const [commandes, setCommandes] = useState<LigneCommandeFournisseur[]>([])
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [boutiqueId, setBoutiqueId] = useState('')
  const { boutiques, nomBoutique } = useBoutiques()

  useEffect(() => {
    api.commandesFournisseurs().then(setCommandes)
    api.fournisseurs().then(setFournisseurs)
  }, [])

  const nomFournisseur = useCallback((id: string) => fournisseurs.find((f) => f.id === id)?.nom ?? id, [fournisseurs])
  const preFiltrees = boutiqueId ? commandes.filter((c) => c.boutique_id === boutiqueId) : commandes
  const getFields = useCallback(
    (c: LigneCommandeFournisseur) => [c.id, nomFournisseur(c.fournisseur_id)],
    [nomFournisseur]
  )
  const { query, setQuery, filtered } = useSearch(preFiltrees, getFields)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Commandes fournisseurs</h1>
          <p className="text-sm text-slate-500">Suivi des achats et réceptions</p>
        </div>
        <button className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
          + Nouvelle commande fournisseur
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Rechercher une commande…" />
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
              <th className="px-4 py-3">Fournisseur</th>
              <th className="px-4 py-3">Boutique destinataire</th>
              <th className="px-4 py-3">Date attendue</th>
              <th className="px-4 py-3 text-right">Montant</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">#{c.id}</td>
                <td className="px-4 py-3 text-slate-600">{nomFournisseur(c.fournisseur_id)}</td>
                <td className="px-4 py-3 text-slate-600">{nomBoutique(c.boutique_id)}</td>
                <td className="px-4 py-3 text-slate-500">{formatShortDate(c.date_attendue)}</td>
                <td className="px-4 py-3 text-right text-slate-900">{formatGNF(c.montant)}</td>
                <td className="px-4 py-3">
                  <Badge tone={STATUT_TONE[c.statut]}>{STATUT_COMMANDE_FOURNISSEUR_LABELS[c.statut]}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
