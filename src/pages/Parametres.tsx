import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import Modal from '../components/Modal'
import Tabs from '../components/Tabs'
import type { ReferentielItem } from '../types'

const CATEGORIE_LABELS: Record<string, string> = {
  secteurs: 'Secteurs',
  villes: 'Villes',
  communes: 'Communes',
  quartiers: 'Quartiers',
  canaux_vente: 'Canaux de vente',
  modes_paiement: 'Modes de paiement',
  categories_depenses: 'Catégories de dépenses',
  categories_produits: 'Catégories de produits',
  caisses_comptes: 'Caisses & comptes',
  livreurs: 'Livreurs',
}

const CATEGORIE_ORDER = [
  'secteurs',
  'villes',
  'communes',
  'quartiers',
  'canaux_vente',
  'modes_paiement',
  'categories_depenses',
  'categories_produits',
  'caisses_comptes',
  'livreurs',
]

export default function Parametres() {
  const [referentiels, setReferentiels] = useState<Record<string, ReferentielItem[]>>({})
  const [categorie, setCategorie] = useState('secteurs')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<ReferentielItem | null>(null)
  const [nom, setNom] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function refresh() {
    api.referentiels().then(setReferentiels)
  }

  useEffect(refresh, [])

  const categories = CATEGORIE_ORDER.filter((c) => c in referentiels)
  const items = referentiels[categorie] ?? []

  function openCreate() {
    setNom('')
    setError(null)
    setCreating(true)
  }

  function openEdit(item: ReferentielItem) {
    setNom(item.nom)
    setError(null)
    setEditing(item)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (editing) {
        await api.modifierReferentiel(categorie, editing.id, { nom })
      } else {
        await api.creerReferentiel(categorie, { nom })
      }
      setCreating(false)
      setEditing(null)
      refresh()
    } catch {
      setError("Échec de l'enregistrement.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item: ReferentielItem) {
    if (!confirm(`Supprimer "${item.nom}" ?`)) return
    await api.supprimerReferentiel(categorie, item.id)
    refresh()
  }

  const showModal = creating || editing !== null

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
          <p className="text-sm text-slate-500">Référentiels : secteurs, zones, canaux, paiements, dépenses, caisses</p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800"
        >
          + Ajouter
        </button>
      </div>

      <Tabs
        tabs={categories.map((c) => ({ key: c, label: CATEGORIE_LABELS[c] ?? c }))}
        active={categorie}
        onChange={setCategorie}
      />

      {categorie === 'secteurs' && (
        <p className="text-xs text-slate-400">
          Les secteurs déterminent la classification des produits, boutiques et fournisseurs dans toute l'application.
        </p>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400">Nom</div>
              <div className="font-medium text-slate-900">{item.nom}</div>
            </div>
            <div className="flex gap-4 text-sm">
              <button onClick={() => openEdit(item)} className="font-medium text-teal-700 hover:underline">
                Modifier
              </button>
              <button onClick={() => handleDelete(item)} className="font-medium text-red-600 hover:underline">
                Suppr.
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-400">Aucun élément dans ce référentiel.</p>}
      </div>

      {showModal && (
        <Modal
          title={editing ? `Modifier "${editing.nom}"` : `Ajouter — ${CATEGORIE_LABELS[categorie] ?? categorie}`}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
        >
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
