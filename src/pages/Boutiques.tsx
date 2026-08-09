import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import { SECTEUR_LABELS, STATUT_BOUTIQUE_LABELS, type Boutique, type Secteur, type StatutBoutique } from '../types'
import type { BoutiqueInput } from '../types/write'

const STATUT_TONE: Record<StatutBoutique, 'success' | 'default' | 'warning'> = {
  active: 'success',
  fermee: 'default',
  en_creation: 'warning',
}

const SECTEURS: Secteur[] = ['habillement', 'alimentation_generale', 'electronique_electromenager']

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

  function refresh() {
    api.boutiques().then(setBoutiques)
  }

  useEffect(refresh, [])

  const villes = useMemo(() => Array.from(new Set(boutiques.map((b) => b.ville))).sort(), [boutiques])

  const filtered = boutiques.filter(
    (b) => (!villeFiltre || b.ville === villeFiltre) && (!statutFiltre || b.statut === statutFiltre)
  )

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

      <div className="flex gap-3">
        <select
          value={villeFiltre}
          onChange={(e) => setVilleFiltre(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        >
          <option value="">Toutes les villes</option>
          {villes.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <select
          value={statutFiltre}
          onChange={(e) => setStatutFiltre(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUT_BOUTIQUE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
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
                      <Badge key={s}>{SECTEUR_LABELS[s]}</Badge>
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
                {SECTEURS.map((s) => (
                  <label key={s} className="flex items-center gap-1.5 text-sm text-slate-700">
                    <input type="checkbox" checked={form.secteurs.includes(s)} onChange={() => toggleSecteur(s)} />
                    {SECTEUR_LABELS[s]}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Quartier</label>
                <input
                  value={form.quartier}
                  onChange={(e) => setForm({ ...form, quartier: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Commune</label>
                <input
                  value={form.commune}
                  onChange={(e) => setForm({ ...form, commune: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Ville</label>
                <input
                  value={form.ville}
                  onChange={(e) => setForm({ ...form, ville: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Responsable</label>
                <input
                  value={form.responsable}
                  onChange={(e) => setForm({ ...form, responsable: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
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
                <select
                  value={form.statut}
                  onChange={(e) => setForm({ ...form, statut: e.target.value as StatutBoutique })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  {Object.entries(STATUT_BOUTIQUE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
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
            <Badge key={s}>{SECTEUR_LABELS[s]}</Badge>
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
