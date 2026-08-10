import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import SearchableSelect from '../components/SearchableSelect'
import SearchInput from '../components/SearchInput'
import { useSearch } from '../lib/useSearch'
import { useSecteurs } from '../lib/useSecteurs'
import { ROLE_LABELS, STATUT_BOUTIQUE_LABELS, type Boutique, type ReferentielItem, type Secteur, type StatutBoutique, type Utilisateur } from '../types'
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
}

export function BoutiquesListe() {
  const [boutiques, setBoutiques] = useState<Boutique[]>([])
  const [villeFiltre, setVilleFiltre] = useState('')
  const [statutFiltre, setStatutFiltre] = useState('')
  const [editing, setEditing] = useState<Boutique | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<BoutiqueInput>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [villesRef, setVillesRef] = useState<ReferentielItem[]>([])
  const [communesRef, setCommunesRef] = useState<ReferentielItem[]>([])
  const [quartiersRef, setQuartiersRef] = useState<ReferentielItem[]>([])
  const [responsables, setResponsables] = useState<Utilisateur[]>([])
  const { secteurs, nomSecteur } = useSecteurs()

  function refresh() {
    api.boutiques().then(setBoutiques)
  }

  useEffect(refresh, [])

  useEffect(() => {
    api.referentiels().then((r) => {
      setVillesRef(r.villes ?? [])
      setCommunesRef(r.communes ?? [])
      setQuartiersRef(r.quartiers ?? [])
    })
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

  function openCreate() {
    setForm(EMPTY_FORM)
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
    })
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
    setSaving(true)
    setError(null)
    try {
      if (editing) {
        await api.modifierBoutique(editing.id, form)
      } else {
        await api.creerBoutique(form)
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
    if (!confirm(`Supprimer la boutique "${b.nom}" ?`)) return
    await api.supprimerBoutique(b.id)
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
        <button
          onClick={openCreate}
          className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800"
        >
          + Ajouter une boutique
        </button>
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
            {filtered.map((b) => (
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
                  <div className="flex gap-3">
                    <button onClick={() => openEdit(b)} className="font-medium text-teal-700 hover:underline">
                      Modifier
                    </button>
                    <button onClick={() => handleDelete(b)} className="font-medium text-red-600 hover:underline">
                      Suppr.
                    </button>
                  </div>
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
      </div>

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

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Quartier</label>
                <SearchableSelect
                  value={form.quartier}
                  onChange={(v) => setForm({ ...form, quartier: v })}
                  options={quartiersRef.map((q) => ({ value: q.nom, label: q.nom }))}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Commune</label>
                <SearchableSelect
                  value={form.commune}
                  onChange={(v) => setForm({ ...form, commune: v })}
                  options={communesRef.map((c) => ({ value: c.nom, label: c.nom }))}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Ville</label>
                <SearchableSelect
                  value={form.ville}
                  onChange={(v) => setForm({ ...form, ville: v })}
                  options={villesRef.map((v) => ({ value: v.nom, label: v.nom }))}
                  required
                />
              </div>
            </div>
            <p className="-mt-2 text-xs text-slate-400">
              Ces listes se gèrent depuis Configuration → Paramètres.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Responsable</label>
                <SearchableSelect
                  value={form.responsable}
                  onChange={(v) => setForm({ ...form, responsable: v })}
                  options={responsables.map((u) => ({
                    value: `${u.prenom} ${u.nom}`,
                    label: `${u.prenom} ${u.nom} — ${ROLE_LABELS[u.role]}`,
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

  if (!boutique) return <div className="text-slate-400">Chargement…</div>

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
