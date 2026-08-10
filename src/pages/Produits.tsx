import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, SERVER_BASE } from '../api/client'
import Badge from '../components/Badge'
import ConfirmDialog from '../components/ConfirmDialog'
import Modal from '../components/Modal'
import SearchableSelect from '../components/SearchableSelect'
import SearchInput from '../components/SearchInput'
import { formatGNF, formatShortDate } from '../lib/format'
import { useBoutiques } from '../lib/useBoutiques'
import { useSearch } from '../lib/useSearch'
import { useSecteurs } from '../lib/useSecteurs'
import type { Produit, ReferentielItem } from '../types'
import type { ProduitInput } from '../types/write'

const EMPTY_FORM: ProduitInput = {
  nom: '',
  secteur: '',
  categorie: '',
  prix: 0,
  unite: 'pièce',
  code_barres: '',
  date_peremption: null,
}

function imageSrc(url: string | null | undefined): string | null {
  return url ? `${SERVER_BASE}${url}` : null
}

export function ProduitsListe() {
  const [produits, setProduits] = useState<Produit[]>([])
  const [secteurFiltre, setSecteurFiltre] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Produit | null>(null)
  const [form, setForm] = useState<ProduitInput>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [categoriesRef, setCategoriesRef] = useState<ReferentielItem[]>([])
  const [confirmDelete, setConfirmDelete] = useState<Produit | null>(null)
  const { secteurs, nomSecteur } = useSecteurs()

  function refresh() {
    api.produits().then(setProduits)
  }

  useEffect(refresh, [])
  useEffect(() => {
    api.referentiels().then((r) => setCategoriesRef(r.categories_produits ?? []))
  }, [])

  const preFiltres = secteurFiltre ? produits.filter((p) => p.secteur === secteurFiltre) : produits
  const getFields = useCallback((p: Produit) => [p.nom, p.categorie, p.code_barres], [])
  const { query, setQuery, filtered } = useSearch(preFiltres, getFields)

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
      refresh()
    } catch {
      setError("Échec de l'enregistrement — le code-barres est peut-être déjà utilisé.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(p: Produit) {
    await api.supprimerProduit(p.id)
    setConfirmDelete(null)
    refresh()
  }

  const showModal = creating || editing !== null

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Produits</h1>
          <p className="text-sm text-slate-500">Catalogue produit — fiches, prix, images</p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800"
        >
          + Ajouter un produit
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un produit…" />
        <div className="w-56">
          <SearchableSelect
            value={secteurFiltre}
            onChange={setSecteurFiltre}
            options={secteurs.map((s) => ({ value: s.id, label: s.nom }))}
            allowEmpty="Tous les secteurs"
            placeholder="Tous les secteurs"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {filtered.map((p) => (
          <Link
            key={p.id}
            to={`/produits/${p.id}`}
            className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-teal-300"
          >
            <div className="mb-3 flex h-24 items-center justify-center overflow-hidden rounded-md bg-slate-100">
              {imageSrc(p.images[0]?.url) ? (
                <img src={imageSrc(p.images[0]?.url)!} alt={p.nom} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-slate-400">photo produit</span>
              )}
            </div>
            <div className="text-sm font-medium text-slate-900">{p.nom}</div>
            <div className="text-xs text-slate-500">
              <Badge>{nomSecteur(p.secteur)}</Badge>
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-900">{formatGNF(p.prix)}</div>
            <div className="mt-2 flex gap-3 text-xs">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  openEdit(p)
                }}
                className="font-medium text-teal-700 hover:underline"
              >
                Modifier
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  setConfirmDelete(p)
                }}
                className="font-medium text-red-600 hover:underline"
              >
                Suppr.
              </button>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && <p className="text-sm text-slate-400">Aucun produit ne correspond à la recherche.</p>}
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
                  onChange={(v) => setForm({ ...form, secteur: v })}
                  options={secteurs.map((s) => ({ value: s.id, label: s.nom }))}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Catégorie</label>
                <SearchableSelect
                  value={form.categorie}
                  onChange={(v) => setForm({ ...form, categorie: v })}
                  options={categoriesRef.map((c) => ({ value: c.nom, label: c.nom }))}
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

      {confirmDelete && (
        <ConfirmDialog
          title="Supprimer le produit"
          message={`Supprimer "${confirmDelete.nom}" du catalogue ? Cette action est irréversible.`}
          confirmLabel="Supprimer"
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}

export function ProduitFiche() {
  const { id } = useParams<{ id: string }>()
  const [produit, setProduit] = useState<Produit | null>(null)
  const [stock, setStock] = useState<{ boutique_id: string; produit_nom: string; quantite_disponible: number; quantite_reservee: number; seuil_alerte: number; statut: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [current, setCurrent] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { nomBoutique } = useBoutiques()
  const { nomSecteur } = useSecteurs()

  function refresh() {
    if (!id) return
    api.produit(id).then(setProduit)
    api.stock().then((rows) => setStock(rows.filter((r) => r.produit_id === id)))
  }

  useEffect(refresh, [id])

  const images = produit?.images ?? []
  const activeImage = images[current]

  function goTo(index: number) {
    if (images.length === 0) return
    setCurrent((index + images.length) % images.length)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !id) return
    setUploading(true)
    try {
      const updated = await api.ajouterImageProduit(id, file)
      setProduit(updated)
      setCurrent(updated.images.length - 1)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleRemoveImage() {
    if (!id || !activeImage) return
    setRemovingId(activeImage.id)
    try {
      const updated = await api.supprimerImageProduit(id, activeImage.id)
      setProduit(updated)
      setCurrent((c) => Math.min(c, Math.max(updated.images.length - 1, 0)))
    } finally {
      setRemovingId(null)
    }
  }

  if (!produit) return <div className="text-slate-400">Chargement…</div>

  return (
    <div className="space-y-6">
      <div>
        <Link to="/produits" className="text-sm text-teal-800 hover:underline">
          ← Retour aux produits
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">{produit.nom}</h1>
          <Badge>{nomSecteur(produit.secteur)}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:col-span-1">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">
            Images {images.length > 0 && <span className="text-slate-400">({current + 1}/{images.length})</span>}
          </h2>
          <div className="relative mb-3 flex h-48 items-center justify-center overflow-hidden rounded-md bg-slate-100">
            {imageSrc(activeImage?.url) ? (
              <img src={imageSrc(activeImage?.url)!} alt={produit.nom} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm text-slate-400">Aucune image</span>
            )}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => goTo(current - 1)}
                  className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1 text-slate-700 shadow hover:bg-white"
                  aria-label="Image précédente"
                >
                  ‹
                </button>
                <button
                  onClick={() => goTo(current + 1)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1 text-slate-700 shadow hover:bg-white"
                  aria-label="Image suivante"
                >
                  ›
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="mb-3 flex justify-center gap-1.5">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setCurrent(i)}
                  className={`h-1.5 w-1.5 rounded-full ${i === current ? 'bg-teal-700' : 'bg-slate-300'}`}
                  aria-label={`Voir l'image ${i + 1}`}
                />
              ))}
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" id="produit-image-input" />
          <div className="flex gap-2">
            <label
              htmlFor="produit-image-input"
              className="flex-1 cursor-pointer rounded-md border border-slate-300 px-3 py-1.5 text-center text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {uploading ? 'Envoi…' : 'Ajouter une image'}
            </label>
            {activeImage && (
              <button
                onClick={handleRemoveImage}
                disabled={removingId === activeImage.id}
                className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Retirer
              </button>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">Détails</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <Field label="Catégorie" value={produit.categorie} />
            <Field label="Prix" value={formatGNF(produit.prix)} />
            <Field label="Unité" value={produit.unite} />
            <Field label="Code-barres" value={produit.code_barres} />
            <Field label="Date de péremption" value={produit.date_peremption ? formatShortDate(produit.date_peremption) : '—'} />
          </dl>
        </section>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Stock par boutique</h2>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Boutique</th>
                <th className="px-4 py-3 text-right">Disponible</th>
                <th className="px-4 py-3 text-right">Réservé</th>
                <th className="px-4 py-3 text-right">Seuil d'alerte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stock.map((s) => (
                <tr key={s.boutique_id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{nomBoutique(s.boutique_id)}</td>
                  <td className="px-4 py-3 text-right">{s.quantite_disponible}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{s.quantite_reservee}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{s.seuil_alerte}</td>
                </tr>
              ))}
              {stock.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-400">
                    Ce produit n'est en stock dans aucune boutique.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
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
