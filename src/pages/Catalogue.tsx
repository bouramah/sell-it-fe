import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import SearchableSelect from '../components/SearchableSelect'
import { formatGNF } from '../lib/format'
import { SECTEUR_LABELS, type Produit, type Secteur } from '../types'
import type { ProduitInput } from '../types/write'

const SECTEURS: Secteur[] = ['habillement', 'alimentation_generale', 'electronique_electromenager']

const EMPTY_FORM: ProduitInput = {
  nom: '',
  secteur: 'habillement',
  categorie: '',
  prix: 0,
  unite: 'pièce',
  code_barres: '',
  date_peremption: null,
}

export default function Catalogue() {
  const [q, setQ] = useState('')
  const [produits, setProduits] = useState<Produit[]>([])
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Produit | null>(null)
  const [form, setForm] = useState<ProduitInput>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function refresh(query?: string) {
    api.produits(query || undefined).then(setProduits)
  }

  useEffect(() => {
    const handle = setTimeout(() => refresh(q), 150)
    return () => clearTimeout(handle)
  }, [q])

  function openCreate() {
    setForm(EMPTY_FORM)
    setError(null)
    setCreating(true)
  }

  function openEdit(p: Produit) {
    setForm({
      nom: p.nom,
      secteur: p.secteur,
      categorie: p.categorie,
      prix: p.prix,
      unite: p.unite,
      code_barres: p.code_barres,
      date_peremption: p.date_peremption,
    })
    setError(null)
    setEditing(p)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (editing) {
        await api.modifierProduit(editing.id, form)
      } else {
        await api.creerProduit(form)
      }
      setCreating(false)
      setEditing(null)
      refresh(q)
    } catch {
      setError('Échec de l\'enregistrement — le code-barres est peut-être déjà utilisé.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(p: Produit) {
    if (!confirm(`Supprimer "${p.nom}" du catalogue ?`)) return
    await api.supprimerProduit(p.id)
    refresh(q)
  }

  const showModal = creating || editing !== null

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Catalogue & recherche IA</h1>
          <p className="text-sm text-slate-500">Moteur de recherche et recommandations produit</p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800"
        >
          + Ajouter un produit
        </button>
      </div>

      <div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Recherche IA — tolérante aux fautes…"
          className="w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {produits.map((p) => (
          <div key={p.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex h-24 items-center justify-center rounded-md bg-slate-100 text-xs text-slate-400">
              photo produit
            </div>
            <div className="text-sm font-medium text-slate-900">{p.nom}</div>
            <div className="text-xs text-slate-500">
              <Badge>{SECTEUR_LABELS[p.secteur]}</Badge>
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-900">{formatGNF(p.prix)}</div>
            <div className="mt-2 flex gap-3 text-xs">
              <button onClick={() => openEdit(p)} className="font-medium text-teal-700 hover:underline">
                Modifier
              </button>
              <button onClick={() => handleDelete(p)} className="font-medium text-red-600 hover:underline">
                Suppr.
              </button>
            </div>
          </div>
        ))}
        {produits.length === 0 && <p className="text-sm text-slate-400">Aucun produit ne correspond à la recherche.</p>}
      </div>

      {showModal && (
        <Modal
          title={editing ? `Modifier ${editing.nom}` : 'Ajouter un produit'}
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Secteur</label>
                <SearchableSelect
                  value={form.secteur}
                  onChange={(v) => setForm({ ...form, secteur: v as Secteur })}
                  options={SECTEURS.map((s) => ({ value: s, label: SECTEUR_LABELS[s] }))}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Catégorie</label>
                <input
                  value={form.categorie}
                  onChange={(e) => setForm({ ...form, categorie: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Prix (GNF)</label>
                <input
                  type="number"
                  min={0}
                  value={form.prix}
                  onChange={(e) => setForm({ ...form, prix: Number(e.target.value) })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Unité</label>
                <input
                  value={form.unite}
                  onChange={(e) => setForm({ ...form, unite: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Code-barres</label>
                <input
                  value={form.code_barres}
                  onChange={(e) => setForm({ ...form, code_barres: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Date de péremption <span className="text-slate-400">(si applicable)</span>
                </label>
                <input
                  type="date"
                  value={form.date_peremption ?? ''}
                  onChange={(e) => setForm({ ...form, date_peremption: e.target.value || null })}
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
    </div>
  )
}
