import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import ConfirmDialog from '../components/ConfirmDialog'
import { SpinnerBloc } from '../components/Spinner'
import { usePermissions } from '../lib/permissions'
import type { Commune, QuartierGeo, Region, SecteurGeo, Ville } from '../types'

type Niveau = 'region' | 'ville' | 'commune' | 'quartier' | 'secteur'

interface ColonneItem {
  id: string
  nom: string
}

const NIVEAUX: { key: Niveau; label: string; parentLabel: string | null }[] = [
  { key: 'region', label: 'Régions', parentLabel: null },
  { key: 'ville', label: 'Villes', parentLabel: 'une région' },
  { key: 'commune', label: 'Communes', parentLabel: 'une ville' },
  { key: 'quartier', label: 'Quartiers', parentLabel: 'une commune' },
  { key: 'secteur', label: 'Secteurs', parentLabel: 'un quartier' },
]

export default function Geographie() {
  const { referentiels: canGerer } = usePermissions()

  const [regions, setRegions] = useState<Region[]>([])
  const [villes, setVilles] = useState<Ville[]>([])
  const [communes, setCommunes] = useState<Commune[]>([])
  const [quartiers, setQuartiers] = useState<QuartierGeo[]>([])
  const [secteurs, setSecteurs] = useState<SecteurGeo[]>([])

  const [regionId, setRegionId] = useState<string | null>(null)
  const [villeId, setVilleId] = useState<string | null>(null)
  const [communeId, setCommuneId] = useState<string | null>(null)
  const [quartierId, setQuartierId] = useState<string | null>(null)

  const [ajoutNiveau, setAjoutNiveau] = useState<Niveau | null>(null)
  const [nom, setNom] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ niveau: Niveau; item: ColonneItem } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.regions().then(setRegions).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!regionId) {
      setVilles([])
      setVilleId(null)
      return
    }
    api.villes(regionId).then(setVilles)
    setVilleId(null)
  }, [regionId])

  useEffect(() => {
    if (!villeId) {
      setCommunes([])
      setCommuneId(null)
      return
    }
    api.communes(villeId).then(setCommunes)
    setCommuneId(null)
  }, [villeId])

  useEffect(() => {
    if (!communeId) {
      setQuartiers([])
      setQuartierId(null)
      return
    }
    api.quartiersGeo(communeId).then(setQuartiers)
    setQuartierId(null)
  }, [communeId])

  useEffect(() => {
    if (!quartierId) {
      setSecteurs([])
      return
    }
    api.secteursGeo(quartierId).then(setSecteurs)
  }, [quartierId])

  function refreshNiveau(niveau: Niveau) {
    if (niveau === 'region') api.regions().then(setRegions)
    else if (niveau === 'ville' && regionId) api.villes(regionId).then(setVilles)
    else if (niveau === 'commune' && villeId) api.communes(villeId).then(setCommunes)
    else if (niveau === 'quartier' && communeId) api.quartiersGeo(communeId).then(setQuartiers)
    else if (niveau === 'secteur' && quartierId) api.secteursGeo(quartierId).then(setSecteurs)
  }

  function openAjout(niveau: Niveau) {
    setNom('')
    setError(null)
    setAjoutNiveau(niveau)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!ajoutNiveau) return
    setSaving(true)
    setError(null)
    try {
      if (ajoutNiveau === 'region') {
        await api.creerRegion({ nom })
      } else if (ajoutNiveau === 'ville') {
        if (!regionId) return
        await api.creerVille({ nom, region_id: regionId })
      } else if (ajoutNiveau === 'commune') {
        if (!villeId) return
        await api.creerCommune({ nom, ville_id: villeId })
      } else if (ajoutNiveau === 'quartier') {
        if (!communeId) return
        await api.creerQuartierGeo({ nom, commune_id: communeId })
      } else if (ajoutNiveau === 'secteur') {
        if (!quartierId) return
        await api.creerSecteurGeo({ nom, quartier_id: quartierId })
      }
      refreshNiveau(ajoutNiveau)
      setAjoutNiveau(null)
    } catch {
      setError("Échec de l'enregistrement.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return
    const { niveau, item } = confirmDelete
    if (niveau === 'region') await api.supprimerRegion(item.id)
    else if (niveau === 'ville') await api.supprimerVille(item.id)
    else if (niveau === 'commune') await api.supprimerCommune(item.id)
    else if (niveau === 'quartier') await api.supprimerQuartierGeo(item.id)
    else if (niveau === 'secteur') await api.supprimerSecteurGeo(item.id)
    setConfirmDelete(null)
    refreshNiveau(niveau)
    // Une suppression en cascade côté DB peut vider les colonnes filles — on les réinitialise.
    if (niveau === 'region' && item.id === regionId) setRegionId(null)
    if (niveau === 'ville' && item.id === villeId) setVilleId(null)
    if (niveau === 'commune' && item.id === communeId) setCommuneId(null)
    if (niveau === 'quartier' && item.id === quartierId) setQuartierId(null)
  }

  const colonnes: { niveau: Niveau; label: string; items: ColonneItem[]; selectedId: string | null; onSelect: (id: string) => void; enabled: boolean }[] = [
    { niveau: 'region', label: 'Régions', items: regions, selectedId: regionId, onSelect: setRegionId, enabled: true },
    { niveau: 'ville', label: 'Villes', items: villes, selectedId: villeId, onSelect: setVilleId, enabled: !!regionId },
    { niveau: 'commune', label: 'Communes', items: communes, selectedId: communeId, onSelect: setCommuneId, enabled: !!villeId },
    { niveau: 'quartier', label: 'Quartiers', items: quartiers, selectedId: quartierId, onSelect: setQuartierId, enabled: !!communeId },
    { niveau: 'secteur', label: 'Secteurs', items: secteurs, selectedId: null, onSelect: () => {}, enabled: !!quartierId },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Découpage géographique</h1>
        <p className="text-sm text-slate-500">
          Région → Ville → Commune → Quartier → Secteur — sert à localiser précisément les clients et les boutiques
          (tournées de livraison, future appli mobile client).
        </p>
      </div>

      {loading && regions.length === 0 ? (
        <SpinnerBloc />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          {colonnes.map((col) => (
            <div key={col.niveau} className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{col.label}</span>
                {canGerer && col.enabled && (
                  <button onClick={() => openAjout(col.niveau)} className="text-xs font-medium text-teal-700 hover:underline">
                    + Ajouter
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto p-2">
                {!col.enabled && col.niveau !== 'region' && (
                  <p className="px-2 py-3 text-xs text-slate-400">
                    Sélectionnez {NIVEAUX.find((n) => n.key === col.niveau)?.parentLabel} d'abord.
                  </p>
                )}
                {col.enabled &&
                  col.items.map((item) => (
                    <div
                      key={item.id}
                      className={`group flex items-center justify-between rounded-md px-2 py-1.5 text-sm ${
                        col.selectedId === item.id ? 'bg-teal-50 text-teal-800' : 'text-slate-700 hover:bg-slate-50'
                      } ${col.niveau !== 'secteur' ? 'cursor-pointer' : ''}`}
                      onClick={() => col.niveau !== 'secteur' && col.onSelect(item.id)}
                    >
                      <span>{item.nom}</span>
                      {canGerer && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setConfirmDelete({ niveau: col.niveau, item })
                          }}
                          className="hidden text-xs font-medium text-red-600 hover:underline group-hover:inline"
                        >
                          Suppr.
                        </button>
                      )}
                    </div>
                  ))}
                {col.enabled && col.items.length === 0 && <p className="px-2 py-3 text-xs text-slate-400">Aucun élément.</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {ajoutNiveau && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">
              Ajouter — {NIVEAUX.find((n) => n.key === ajoutNiveau)?.label}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nom</label>
                <input
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAjoutNiveau(null)}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
                >
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Supprimer l'élément"
          message={`Supprimer "${confirmDelete.item.nom}" ? Tous les éléments enfants (villes, communes, quartiers, secteurs) seront supprimés en cascade.`}
          confirmLabel="Supprimer"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
