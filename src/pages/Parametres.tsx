import { useEffect, useState } from 'react'
import { api } from '../api/client'
import Tabs from '../components/Tabs'
import type { ReferentielItem } from '../types'

const CATEGORIE_LABELS: Record<string, string> = {
  secteurs: 'Secteurs',
  villes_communes_quartiers: 'Villes / communes / quartiers',
  canaux_vente: 'Canaux de vente',
  modes_paiement: 'Modes de paiement',
  categories_depenses: 'Catégories de dépenses',
  caisses_comptes: 'Caisses & comptes',
}

export default function Parametres() {
  const [referentiels, setReferentiels] = useState<Record<string, ReferentielItem[]>>({})
  const [categorie, setCategorie] = useState('secteurs')

  useEffect(() => {
    api.referentiels().then(setReferentiels)
  }, [])

  const categories = Object.keys(referentiels)
  const items = referentiels[categorie] ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
          <p className="text-sm text-slate-500">Référentiels : secteurs, zones, canaux, paiements, dépenses, caisses</p>
        </div>
        <button className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
          + Ajouter
        </button>
      </div>

      <Tabs
        tabs={categories.map((c) => ({ key: c, label: CATEGORIE_LABELS[c] ?? c }))}
        active={categorie}
        onChange={setCategorie}
      />

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400">Nom</div>
              <div className="font-medium text-slate-900">{item.nom}</div>
            </div>
            <div className="flex gap-4 text-sm">
              <button className="font-medium text-teal-700 hover:underline">Modifier</button>
              <button className="font-medium text-red-600 hover:underline">Suppr.</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
