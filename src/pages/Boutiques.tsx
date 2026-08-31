import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import Badge from '../components/Badge'
import ConfirmDialog from '../components/ConfirmDialog'
import GeoPicker, { type GeoResolved } from '../components/GeoPicker'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import SearchableSelect from '../components/SearchableSelect'
import SearchInput from '../components/SearchInput'
import { SpinnerBloc } from '../components/Spinner'
import { usePagination } from '../lib/usePagination'
import { usePermissions } from '../lib/permissions'
import { useSearch } from '../lib/useSearch'
import { useSecteurs } from '../lib/useSecteurs'
import { useRoles } from '../lib/useRoles'
import { STATUT_BOUTIQUE_LABELS, type Boutique, type Secteur, type StatutBoutique, type Utilisateur } from '../types'
import type { BoutiqueInput } from '../types/write'

const STATUT_TONE: Record<StatutBoutique, 'success' | 'default' | 'warning'> = {
  active: 'success',
  fermee: 'default',
  en_creation: 'warning',
}

const EMPTY_FORM: BoutiqueInput = {
  nom: '',
  secteurs: [],
  quartier: '',
  commune: '',
  ville: '',
  horaires: '',
  responsable: '',
  statut: 'en_creation',
  telephone: '',
  latitude: null,
  longitude: null,
  secteur_geo_id: null,
}

export function BoutiquesListe() {
  const [boutiques, setBoutiques] = useState<Boutique[]>([])
  const [loading, setLoading] = useState(true)
  const [villeFiltre, setVilleFiltre] = useState('')
  const [statutFiltre, setStatutFiltre] = useState('')
  const [editing, setEditing] = useState<Boutique | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<BoutiqueInput>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [geoResolved, setGeoResolved] = useState<GeoResolved | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Boutique | null>(null)
  const [responsables, setResponsables] = useState<Utilisateur[]>([])
  const { secteurs, nomSecteur } = useSecteurs()
  const { nomRole } = useRoles()
  const { reseau: canGererReseau } = usePermissions()

  function refresh() {
    setLoading(true)
    api.boutiques().then(setBoutiques).finally(() => setLoading(false))
  }

  useEffect(refresh, [])

  useEffect(() => {
    api.utilisateurs().then((users) =>
      setResponsables(users.filter((u) => u.role === 'gerant' || u.role === 'administrateur'))
    )
  }, [])

  const villes = useMemo(() => Array.from(new Set(boutiques.map((b) => b.ville))).sort(), [boutiques])

  const preFiltered = boutiques.filter(
    (b) => (!villeFiltre || b.ville === villeFiltre) && (!statutFiltre || b.statut === statutFiltre)
  )
  const getFields = useCallback(
    (b: Boutique) => [b.nom, b.quartier, b.commune, b.ville, b.responsable],
    []
  )
  const { query, setQuery, filtered } = useSearch(preFiltered, getFields)
  const { page, setPage, pageCount, paginated, totalItems, pageSize } = usePagination(filtered)

  function openCreate() {
    setForm(EMPTY_FORM)
    setGeoResolved(null)
    setError(null)
    setCreating(true)
  }

  function openEdit(b: Boutique) {
    setForm({
      nom: b.nom,
      secteurs: b.secteurs,
      quartier: b.quartier,
      commune: b.commune,
      ville: b.ville,
      horaires: b.horaires,
      responsable: b.responsable,
      statut: b.statut,
      telephone: b.telephone,
      latitude: b.latitude,
      longitude: b.longitude,
      secteur_geo_id: b.secteur_geo_id,
    })
    setGeoResolved(null)
    setError(null)
    setEditing(b)
  }

  function toggleSecteur(s: Secteur) {
    setForm((f) => ({
      ...f,
      secteurs: f.secteurs.includes(s) ? f.secteurs.filter((x) => x !== s) : [...f.secteurs, s],
    }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (form.secteurs.length === 0) {
      setError('Sélectionnez au moins un secteur.')
      return
    }
    if (!form.secteur_geo_id && !geoResolved) {
      setError('Sélectionnez la localisation complète (région → secteur).')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload: BoutiqueInput = {
        ...form,
        quartier: geoResolved?.quartierNom ?? form.quartier,
        commune: geoResolved?.communeNom ?? form.commune,
        ville: geoResolved?.villeNom ?? form.ville,
      }
      if (editing) {
        await api.modifierBoutique(editing.id, payload)
      } else {
        await api.creerBoutique(payload)
      }
      setEditing(null)
      setCreating(false)
      refresh()
    } catch {
      setError("Échec de l'enregistrement — vérifiez les champs.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(b: Boutique) {
    await api.supprimerBoutique(b.id)
    setConfirmDelete(null)
    refresh()
  }

  const showModal = creating || editing !== null

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Boutiques</h1>
          <p className="text-sm text-slate-500">Réseau de points de vente — identité, localisation, statut</p>
        </div>
        {canGererReseau && (
          <button
            onClick={openCreate}
            className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800"
          >
            + Ajouter une boutique
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Rechercher une boutique…" />
        <div className="w-48">
          <SearchableSelect
            value={villeFiltre}
            onChange={setVilleFiltre}
            options={villes.map((v) => ({ value: v, label: v }))}
            allowEmpty="Toutes les villes"
            placeholder="Toutes les villes"
          />
        </div>
        <div className="w-48">
          <SearchableSelect
            value={statutFiltre}
            onChange={setStatutFiltre}
            options={Object.entries(STATUT_BOUTIQUE_LABELS).map(([value, label]) => ({ value, label }))}
            allowEmpty="Tous les statuts"
            placeholder="Tous les statuts"
          />
        </div>
      </div>

      {loading && boutiques.length === 0 ? (
        <SpinnerBloc />
      ) : (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Boutique</th>
              <th className="px-4 py-3">Localisation</th>
              <th className="px-4 py-3">Secteur(s)</th>
              <th className="px-4 py-3">Responsable</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link to={`/boutiques/${b.id}`} className="font-medium text-teal-800 hover:underline">
                    {b.nom}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {b.quartier}, {b.commune} — {b.ville}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {b.secteurs.map((s) => (
                      <Badge key={s}>{nomSecteur(s)}</Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{b.responsable}</td>
                <td className="px-4 py-3">
                  <Badge tone={STATUT_TONE[b.statut]}>{STATUT_BOUTIQUE_LABELS[b.statut]}</Badge>
                </td>
                <td className="px-4 py-3">
                  {canGererReseau && (
                    <div className="flex gap-3">
                      <button onClick={() => openEdit(b)} className="font-medium text-teal-700 hover:underline">
                        Modifier
                      </button>
                      <button onClick={() => setConfirmDelete(b)} className="font-medium text-red-600 hover:underline">
                        Suppr.
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-400">
                  Aucune boutique ne correspond à la recherche.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination page={page} pageCount={pageCount} onChange={setPage} totalItems={totalItems} pageSize={pageSize} />
      </div>
      )}

      {showModal && (
        <Modal
          title={editing ? `Modifier ${editing.nom}` : 'Ajouter une boutique'}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nom</label>
              <input
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Secteur(s) exploité(s)</label>
              <div className="flex flex-wrap gap-3">
                {secteurs.map((s) => (
                  <label key={s.id} className="flex items-center gap-1.5 text-sm text-slate-700">
                    <input type="checkbox" checked={form.secteurs.includes(s.id)} onChange={() => toggleSecteur(s.id)} />
                    {s.nom}
                  </label>
                ))}
              </div>
            </div>

            <GeoPicker
              value={form.secteur_geo_id ?? null}
              onChange={(id, resolved) => {
                setForm({ ...form, secteur_geo_id: id })
                setGeoResolved(resolved ?? null)
              }}
              label="Localisation"
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Responsable</label>
                <SearchableSelect
                  value={form.responsable}
                  onChange={(v) => setForm({ ...form, responsable: v })}
                  options={responsables.map((u) => ({
                    value: `${u.prenom} ${u.nom}`,
                    label: `${u.prenom} ${u.nom} — ${nomRole(u.role)} — ${u.contact}`,
                  }))}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Téléphone</label>
                <input
                  value={form.telephone}
                  onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Horaires</label>
                <input
                  value={form.horaires}
                  onChange={(e) => setForm({ ...form, horaires: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Statut</label>
                <SearchableSelect
                  value={form.statut}
                  onChange={(v) => setForm({ ...form, statut: v as StatutBoutique })}
                  options={Object.entries(STATUT_BOUTIQUE_LABELS).map(([value, label]) => ({ value, label }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Latitude (optionnel)</label>
                <input
                  type="number"
                  step="any"
                  value={form.latitude ?? ''}
                  onChange={(e) => setForm({ ...form, latitude: e.target.value === '' ? null : Number(e.target.value) })}
                  placeholder="Ex : 9.5370"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Longitude (optionnel)</label>
                <input
                  type="number"
                  step="any"
                  value={form.longitude ?? ''}
                  onChange={(e) => setForm({ ...form, longitude: e.target.value === '' ? null : Number(e.target.value) })}
                  placeholder="Ex : -13.6785"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCreating(false)
                  setEditing(null)
                }}
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
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Supprimer la boutique"
          message={`Supprimer la boutique "${confirmDelete.nom}" ? Cette action est irréversible.`}
          confirmLabel="Supprimer"
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}

export function BoutiqueFiche() {
  const { id } = useParams<{ id: string }>()
  const [boutique, setBoutique] = useState<Boutique | null>(null)
  const { nomSecteur } = useSecteurs()

  useEffect(() => {
    if (id) api.boutique(id).then(setBoutique)
  }, [id])

  if (!boutique) return <SpinnerBloc />

  return (
    <div className="space-y-6">
      <div>
        <Link to="/boutiques" className="text-sm text-teal-800 hover:underline">
          ← Retour aux boutiques
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">{boutique.nom}</h1>
          <Badge tone={STATUT_TONE[boutique.statut]}>{STATUT_BOUTIQUE_LABELS[boutique.statut]}</Badge>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {boutique.secteurs.map((s) => (
            <Badge key={s}>{nomSecteur(s)}</Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">Localisation</h2>
          <dl className="space-y-2 text-sm">
            <Field label="Quartier" value={boutique.quartier} />
            <Field label="Commune" value={boutique.commune} />
            <Field label="Ville / région" value={boutique.ville} />
            <Field label="Téléphone" value={boutique.telephone} />
            {boutique.latitude != null && boutique.longitude != null && (
              <div className="flex justify-between gap-4 pt-1">
                <dt className="text-slate-500">Position GPS</dt>
                <dd>
                  <a
                    href={`https://www.google.com/maps?q=${boutique.latitude},${boutique.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-teal-700 hover:underline"
                  >
                    Voir sur la carte
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">Exploitation</h2>
          <dl className="space-y-2 text-sm">
            <Field label="Responsable" value={boutique.responsable} />
            <Field label="Horaires" value={boutique.horaires} />
          </dl>
        </section>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-100 pb-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  )
}
