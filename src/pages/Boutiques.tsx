import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import Badge from '../components/Badge'
import { SECTEUR_LABELS, STATUT_BOUTIQUE_LABELS, type Boutique, type StatutBoutique } from '../types'

const STATUT_TONE: Record<StatutBoutique, 'success' | 'default' | 'warning'> = {
  active: 'success',
  fermee: 'default',
  en_creation: 'warning',
}

export function BoutiquesListe() {
  const [boutiques, setBoutiques] = useState<Boutique[]>([])
  const [villeFiltre, setVilleFiltre] = useState('')
  const [statutFiltre, setStatutFiltre] = useState('')

  useEffect(() => {
    api.boutiques().then(setBoutiques)
  }, [])

  const villes = useMemo(() => Array.from(new Set(boutiques.map((b) => b.ville))).sort(), [boutiques])

  const filtered = boutiques.filter(
    (b) => (!villeFiltre || b.ville === villeFiltre) && (!statutFiltre || b.statut === statutFiltre)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Boutiques</h1>
          <p className="text-sm text-slate-500">Réseau de points de vente — identité, localisation, statut</p>
        </div>
        <button className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
