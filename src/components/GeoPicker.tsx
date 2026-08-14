import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import SearchableSelect from './SearchableSelect'
import type { Commune, QuartierGeo, Region, SecteurGeo, Ville } from '../types'

export interface GeoResolved {
  secteurGeoId: string
  quartierNom: string
  communeNom: string
  villeNom: string
}

interface GeoPickerProps {
  /** secteur_geo_id sélectionné, ou null si aucun. */
  value: string | null
  onChange: (secteurGeoId: string | null, resolved?: GeoResolved) => void
  label?: string
  required?: boolean
}

/** Sélecteur en cascade Région → Ville → Commune → Quartier → Secteur, qui résout vers un
 * secteur_geo_id. Charge les référentiels géographiques en une fois (petits volumes) pour
 * pouvoir filtrer localement ET reconstituer la chaîne de parenté quand une valeur initiale
 * est fournie (édition) — l'API n'expose pas de "get by id" unique pour remonter la chaîne. */
export default function GeoPicker({ value, onChange, label = 'Localisation', required }: GeoPickerProps) {
  const [regions, setRegions] = useState<Region[]>([])
  const [villes, setVilles] = useState<Ville[]>([])
  const [communes, setCommunes] = useState<Commune[]>([])
  const [quartiers, setQuartiers] = useState<QuartierGeo[]>([])
  const [secteurs, setSecteurs] = useState<SecteurGeo[]>([])
  const [loaded, setLoaded] = useState(false)

  const [regionId, setRegionId] = useState('')
  const [villeId, setVilleId] = useState('')
  const [communeId, setCommuneId] = useState('')
  const [quartierId, setQuartierId] = useState('')

  useEffect(() => {
    Promise.all([api.regions(), api.villes(), api.communes(), api.quartiersGeo(), api.secteursGeo()]).then(
      ([r, v, c, q, s]) => {
        setRegions(r)
        setVilles(v)
        setCommunes(c)
        setQuartiers(q)
        setSecteurs(s)
        setLoaded(true)
      },
    )
  }, [])

  // Reconstitue la chaîne de parenté à partir du secteur_geo_id initial, une fois les données chargées.
  useEffect(() => {
    if (!loaded || !value) return
    const secteur = secteurs.find((s) => s.id === value)
    if (!secteur) return
    const quartier = quartiers.find((q) => q.id === secteur.quartier_id)
    if (!quartier) return
    const commune = communes.find((c) => c.id === quartier.commune_id)
    if (!commune) return
    const ville = villes.find((v) => v.id === commune.ville_id)
    if (!ville) return
    setRegionId(ville.region_id)
    setVilleId(ville.id)
    setCommuneId(commune.id)
    setQuartierId(quartier.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, value])

  const villesFiltrees = useMemo(() => villes.filter((v) => v.region_id === regionId), [villes, regionId])
  const communesFiltrees = useMemo(() => communes.filter((c) => c.ville_id === villeId), [communes, villeId])
  const quartiersFiltres = useMemo(() => quartiers.filter((q) => q.commune_id === communeId), [quartiers, communeId])
  const secteursFiltres = useMemo(() => secteurs.filter((s) => s.quartier_id === quartierId), [secteurs, quartierId])

  function selectionnerSecteur(secteurId: string) {
    if (!secteurId) {
      onChange(null)
      return
    }
    const secteur = secteursFiltres.find((s) => s.id === secteurId)
    const quartier = quartiers.find((q) => q.id === quartierId)
    const commune = communes.find((c) => c.id === communeId)
    const ville = villes.find((v) => v.id === villeId)
    if (secteur && quartier && commune && ville) {
      onChange(secteurId, { secteurGeoId: secteurId, quartierNom: quartier.nom, communeNom: commune.nom, villeNom: ville.nom })
    } else {
      onChange(secteurId)
    }
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
        <SearchableSelect
          value={regionId}
          onChange={(v) => {
            setRegionId(v)
            setVilleId('')
            setCommuneId('')
            setQuartierId('')
            onChange(null)
          }}
          options={regions.map((r) => ({ value: r.id, label: r.nom }))}
          placeholder="Région…"
          required={required}
        />
        <SearchableSelect
          value={villeId}
          onChange={(v) => {
            setVilleId(v)
            setCommuneId('')
            setQuartierId('')
            onChange(null)
          }}
          options={villesFiltrees.map((v) => ({ value: v.id, label: v.nom }))}
          placeholder="Ville…"
          required={required}
          disabled={!regionId}
        />
        <SearchableSelect
          value={communeId}
          onChange={(v) => {
            setCommuneId(v)
            setQuartierId('')
            onChange(null)
          }}
          options={communesFiltrees.map((c) => ({ value: c.id, label: c.nom }))}
          placeholder="Commune…"
          required={required}
          disabled={!villeId}
        />
        <SearchableSelect
          value={quartierId}
          onChange={(v) => {
            setQuartierId(v)
            onChange(null)
          }}
          options={quartiersFiltres.map((q) => ({ value: q.id, label: q.nom }))}
          placeholder="Quartier…"
          required={required}
          disabled={!communeId}
        />
        <SearchableSelect
          value={value ?? ''}
          onChange={selectionnerSecteur}
          options={secteursFiltres.map((s) => ({ value: s.id, label: s.nom }))}
          placeholder="Secteur…"
          required={required}
          disabled={!quartierId}
        />
      </div>
      <p className="mt-1 text-xs text-slate-400">
        Référentiel géré dans Configuration → Découpage géographique.
      </p>
    </div>
  )
}
