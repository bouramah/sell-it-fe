import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, SERVER_BASE } from '../api/client'
import Badge from '../components/Badge'
import ConfirmDialog from '../components/ConfirmDialog'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import SearchableSelect from '../components/SearchableSelect'
import SearchInput from '../components/SearchInput'
import { formatGNF, formatShortDate } from '../lib/format'
import { useBoutiques } from '../lib/useBoutiques'
import { usePagination } from '../lib/usePagination'
import { usePermissions } from '../lib/permissions'
import { useSearch } from '../lib/useSearch'
import { useSecteurs } from '../lib/useSecteurs'
import { PALIER_PRIX_LABELS, type Fournisseur, type PalierPrix, type PrixAchat, type PrixPeriode, type Produit, type ReferentielItem } from '../types'
import type { PrixAchatInput, PrixPeriodeInput, ProduitCreateInput } from '../types/write'

const PALIERS: PalierPrix[] = ['detail', 'semi_gros', 'gros']

const EMPTY_FORM: ProduitCreateInput = {
  nom: '',
  secteur: '',
  categorie: '',
  prix_detail: 0,
  prix_semi_gros: 0,
  prix_gros: 0,
  seuil_semi_gros: 10,
  seuil_gros: 50,
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
  const [form, setForm] = useState<ProduitCreateInput>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [categoriesRef, setCategoriesRef] = useState<ReferentielItem[]>([])
  const [confirmDelete, setConfirmDelete] = useState<Produit | null>(null)
  const { secteurs, nomSecteur } = useSecteurs()
  const { produitGestion: canGererProduit } = usePermissions()

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
  const { page, setPage, pageCount, paginated, totalItems, pageSize } = usePagination(filtered)

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
      prix_detail: p.prix_detail,
      prix_semi_gros: p.prix_semi_gros,
      prix_gros: p.prix_gros,
      seuil_semi_gros: p.seuil_semi_gros,
      seuil_gros: p.seuil_gros,
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
        const { nom, secteur, categorie, seuil_semi_gros, seuil_gros, unite, code_barres, date_peremption } = form
        await api.modifierProduit(editing.id, { nom, secteur, categorie, seuil_semi_gros, seuil_gros, unite, code_barres, date_peremption })
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
        {canGererProduit && (
          <button
            onClick={openCreate}
            className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800"
          >
            + Ajouter un produit
          </button>
        )}
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
        {paginated.map((p) => (
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
            <div className="mt-2 text-sm font-semibold text-slate-900">{formatGNF(p.prix_detail)} <span className="font-normal text-slate-400">détail</span></div>
            {canGererProduit && (
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
            )}
          </Link>
        ))}
        {filtered.length === 0 && <p className="text-sm text-slate-400">Aucun produit ne correspond à la recherche.</p>}
      </div>
      <Pagination page={page} pageCount={pageCount} onChange={setPage} totalItems={totalItems} pageSize={pageSize} />

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

            {editing ? (
              <p className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-500">
                Les prix se gèrent depuis la fiche produit (périodes de validité, traçables et sans chevauchement) — pas ici.
              </p>
            ) : (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Prix de départ (GNF) <span className="font-normal text-slate-400">— crée la première période réseau, modifiable ensuite depuis la fiche produit</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Détail</label>
                    <input
                      type="number"
                      min={0}
                      value={form.prix_detail}
                      onChange={(e) => setForm({ ...form, prix_detail: Number(e.target.value) })}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Semi-gros</label>
                    <input
                      type="number"
                      min={0}
                      value={form.prix_semi_gros}
                      onChange={(e) => setForm({ ...form, prix_semi_gros: Number(e.target.value) })}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Gros</label>
                    <input
                      type="number"
                      min={0}
                      value={form.prix_gros}
                      onChange={(e) => setForm({ ...form, prix_gros: Number(e.target.value) })}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Seuil semi-gros <span className="font-normal text-slate-400">(qté ≥)</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.seuil_semi_gros}
                  onChange={(e) => setForm({ ...form, seuil_semi_gros: Number(e.target.value) })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Seuil gros <span className="font-normal text-slate-400">(qté ≥)</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.seuil_gros}
                  onChange={(e) => setForm({ ...form, seuil_gros: Number(e.target.value) })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
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

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

const EMPTY_PERIODE_FORM: PrixPeriodeInput = { boutique_id: null, palier: 'detail', prix: 0, date_debut: todayIso(), date_fin: null }
const EMPTY_ACHAT_FORM = (fournisseurId: string): PrixAchatInput => ({ fournisseur_id: fournisseurId, palier: 'detail', prix: 0, date_debut: todayIso(), date_fin: null })

export function ProduitFiche() {
  const { id } = useParams<{ id: string }>()
  const [produit, setProduit] = useState<Produit | null>(null)
  const [stock, setStock] = useState<{ boutique_id: string; produit_nom: string; quantite_disponible: number; quantite_reservee: number; seuil_alerte: number; statut: string }[]>([])
  const [periodes, setPeriodes] = useState<PrixPeriode[]>([])
  const [periodeForm, setPeriodeForm] = useState<PrixPeriodeInput>(EMPTY_PERIODE_FORM)
  const [periodeError, setPeriodeError] = useState<string | null>(null)
  const [savingPeriode, setSavingPeriode] = useState(false)
  const [closingId, setClosingId] = useState<string | null>(null)
  const [dateFinFermeture, setDateFinFermeture] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [achats, setAchats] = useState<PrixAchat[]>([])
  const [achatForm, setAchatForm] = useState<PrixAchatInput>(EMPTY_ACHAT_FORM(''))
  const [achatError, setAchatError] = useState<string | null>(null)
  const [savingAchat, setSavingAchat] = useState(false)
  const [closingAchatId, setClosingAchatId] = useState<string | null>(null)
  const [dateFinFermetureAchat, setDateFinFermetureAchat] = useState('')
  const [deletingAchatId, setDeletingAchatId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [current, setCurrent] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { boutiques, nomBoutique } = useBoutiques()
  const { nomSecteur } = useSecteurs()
  const { produitGestion: canGererProduit, fournisseurGestion: canGererFournisseur } = usePermissions()

  function refresh() {
    if (!id) return
    api.produit(id).then(setProduit)
    api.stock().then((rows) => setStock(rows.filter((r) => r.produit_id === id)))
    api.prixPeriodes(id).then(setPeriodes)
    api.prixAchat(id).then(setAchats)
  }

  useEffect(refresh, [id])
  useEffect(() => {
    api.fournisseurs().then((rows) => {
      setFournisseurs(rows)
      setAchatForm((f) => (f.fournisseur_id ? f : EMPTY_ACHAT_FORM(rows[0]?.id ?? '')))
    })
  }, [])

  function nomFournisseur(fid: string) {
    return fournisseurs.find((f) => f.id === fid)?.nom ?? fid
  }

  async function handleCreerAchat(e: FormEvent) {
    e.preventDefault()
    if (!id) return
    setSavingAchat(true)
    setAchatError(null)
    try {
      await api.creerPrixAchat(id, achatForm)
      setAchatForm({ ...EMPTY_ACHAT_FORM(achatForm.fournisseur_id) })
      refresh()
    } catch (err) {
      setAchatError(err instanceof Error && err.message ? err.message : "Échec de l'enregistrement du prix d'achat.")
    } finally {
      setSavingAchat(false)
    }
  }

  function openFermetureAchat(p: PrixAchat) {
    setClosingAchatId(p.id)
    setDateFinFermetureAchat(todayIso())
    setAchatError(null)
  }

  async function handleFermerAchat(p: PrixAchat) {
    if (!dateFinFermetureAchat) return
    setSavingAchat(true)
    setAchatError(null)
    try {
      await api.modifierPrixAchat(p.produit_id, p.id, {
        fournisseur_id: p.fournisseur_id, palier: p.palier, prix: p.prix, date_debut: p.date_debut, date_fin: dateFinFermetureAchat,
      })
      setClosingAchatId(null)
      refresh()
    } catch (err) {
      setAchatError(err instanceof Error && err.message ? err.message : 'Échec de la fermeture.')
    } finally {
      setSavingAchat(false)
    }
  }

  async function handleSupprimerAchat(p: PrixAchat) {
    setDeletingAchatId(p.id)
    try {
      await api.supprimerPrixAchat(p.produit_id, p.id)
      refresh()
    } finally {
      setDeletingAchatId(null)
    }
  }

  async function handleCreerPeriode(e: FormEvent) {
    e.preventDefault()
    if (!id) return
    setSavingPeriode(true)
    setPeriodeError(null)
    try {
      await api.creerPrixPeriode(id, periodeForm)
      setPeriodeForm({ ...EMPTY_PERIODE_FORM, boutique_id: periodeForm.boutique_id })
      refresh()
    } catch (err) {
      setPeriodeError(err instanceof Error && err.message ? err.message : "Échec de l'enregistrement de la période.")
    } finally {
      setSavingPeriode(false)
    }
  }

  function openFermeture(p: PrixPeriode) {
    setClosingId(p.id)
    setDateFinFermeture(todayIso())
    setPeriodeError(null)
  }

  async function handleFermerPeriode(p: PrixPeriode) {
    if (!dateFinFermeture) return
    setSavingPeriode(true)
    setPeriodeError(null)
    try {
      await api.modifierPrixPeriode(p.produit_id, p.id, {
        boutique_id: p.boutique_id, palier: p.palier, prix: p.prix, date_debut: p.date_debut, date_fin: dateFinFermeture,
      })
      setClosingId(null)
      refresh()
    } catch (err) {
      setPeriodeError(err instanceof Error && err.message ? err.message : 'Échec de la fermeture de la période.')
    } finally {
      setSavingPeriode(false)
    }
  }

  async function handleSupprimerPeriode(p: PrixPeriode) {
    setDeletingId(p.id)
    try {
      await api.supprimerPrixPeriode(p.produit_id, p.id)
      refresh()
    } finally {
      setDeletingId(null)
    }
  }

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
          {canGererProduit && (
          <>
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
          </>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">Détails</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <Field label="Catégorie" value={produit.categorie} />
            <Field label="Prix détail" value={formatGNF(produit.prix_detail)} />
            <Field label="Prix semi-gros" value={`${formatGNF(produit.prix_semi_gros)} (dès ${produit.seuil_semi_gros})`} />
            <Field label="Prix gros" value={`${formatGNF(produit.prix_gros)} (dès ${produit.seuil_gros})`} />
            <Field label="Unité" value={produit.unite} />
            <Field label="Code-barres" value={produit.code_barres} />
            <Field label="Date de péremption" value={produit.date_peremption ? formatShortDate(produit.date_peremption) : '—'} />
          </dl>
        </section>
      </div>

      {canGererProduit && (
        <section>
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-600">Périodes de prix</h2>
          <p className="mb-3 text-xs text-slate-500">
            Chaque prix vaut pour une période [début, fin] — sans chevauchement pour un même palier et une même boutique (ou le réseau).
            Une période sans fin reste active jusqu'à ce qu'elle soit fermée. Fermez une période ouverte avant d'en ajouter une nouvelle
            qui la chevaucherait — utile aussi pour programmer un prix à l'avance (ex. "à partir du 1er du mois prochain").
          </p>

          <form onSubmit={handleCreerPeriode} className="mb-4 grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-5">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Portée</label>
              <SearchableSelect
                value={periodeForm.boutique_id ?? ''}
                onChange={(v) => setPeriodeForm({ ...periodeForm, boutique_id: v || null })}
                options={boutiques.map((b) => ({ value: b.id, label: b.nom }))}
                allowEmpty="Réseau (toutes boutiques)"
                placeholder="Réseau (toutes boutiques)"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Palier</label>
              <SearchableSelect
                value={periodeForm.palier}
                onChange={(v) => setPeriodeForm({ ...periodeForm, palier: v as PalierPrix })}
                options={PALIERS.map((p) => ({ value: p, label: PALIER_PRIX_LABELS[p] }))}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Prix (GNF)</label>
              <input
                type="number"
                min={0}
                value={periodeForm.prix}
                onChange={(e) => setPeriodeForm({ ...periodeForm, prix: Number(e.target.value) })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Date de début</label>
              <input
                type="date"
                value={periodeForm.date_debut}
                onChange={(e) => setPeriodeForm({ ...periodeForm, date_debut: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Date de fin (optionnel)</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={periodeForm.date_fin ?? ''}
                  onChange={(e) => setPeriodeForm({ ...periodeForm, date_fin: e.target.value || null })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={savingPeriode}
                  className="whitespace-nowrap rounded-md bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
                >
                  {savingPeriode ? '…' : 'Ajouter'}
                </button>
              </div>
            </div>
            {periodeError && <p className="col-span-full text-sm text-red-600">{periodeError}</p>}
          </form>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Portée</th>
                  <th className="px-4 py-3">Palier</th>
                  <th className="px-4 py-3 text-right">Prix</th>
                  <th className="px-4 py-3">Du</th>
                  <th className="px-4 py-3">Au</th>
                  <th className="px-4 py-3">Modifié par</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {periodes.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 text-slate-600">{p.boutique_id ? nomBoutique(p.boutique_id) : <span className="font-medium text-slate-900">Réseau</span>}</td>
                    <td className="px-4 py-3 text-slate-600">{PALIER_PRIX_LABELS[p.palier]}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">{formatGNF(p.prix)}</td>
                    <td className="px-4 py-3 text-slate-500">{formatShortDate(p.date_debut)}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {closingId === p.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="date"
                            value={dateFinFermeture}
                            onChange={(e) => setDateFinFermeture(e.target.value)}
                            className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                          />
                          <button onClick={() => handleFermerPeriode(p)} disabled={savingPeriode} className="text-xs font-medium text-teal-700 hover:underline disabled:opacity-50">
                            OK
                          </button>
                          <button onClick={() => setClosingId(null)} className="text-xs text-slate-400 hover:underline">✕</button>
                        </div>
                      ) : p.date_fin ? (
                        formatShortDate(p.date_fin)
                      ) : (
                        <Badge tone="success">en cours</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{p.modifie_par}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {!p.date_fin && closingId !== p.id && (
                          <button onClick={() => openFermeture(p)} className="text-xs font-medium text-teal-700 hover:underline">
                            Fermer
                          </button>
                        )}
                        <button
                          onClick={() => handleSupprimerPeriode(p)}
                          disabled={deletingId === p.id}
                          className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                        >
                          Suppr.
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {periodes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-400">
                      Aucune période de prix enregistrée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {canGererFournisseur && (
        <section>
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-600">Prix d'achat</h2>
          <p className="mb-3 text-xs text-slate-500">
            Un fournisseur peut consentir un meilleur prix selon le volume acheté — même mécanique de périodes que le prix de vente,
            propre à chaque fournisseur (pas de prix réseau côté achat).
          </p>

          <form onSubmit={handleCreerAchat} className="mb-4 grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-5">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Fournisseur</label>
              <SearchableSelect
                value={achatForm.fournisseur_id}
                onChange={(v) => setAchatForm({ ...achatForm, fournisseur_id: v })}
                options={fournisseurs.map((f) => ({ value: f.id, label: f.nom }))}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Palier (volume)</label>
              <SearchableSelect
                value={achatForm.palier}
                onChange={(v) => setAchatForm({ ...achatForm, palier: v as PalierPrix })}
                options={(['detail', 'semi_gros', 'gros'] as PalierPrix[]).map((p) => ({ value: p, label: PALIER_PRIX_LABELS[p] }))}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Prix d'achat (GNF)</label>
              <input
                type="number"
                min={0}
                value={achatForm.prix}
                onChange={(e) => setAchatForm({ ...achatForm, prix: Number(e.target.value) })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Date de début</label>
              <input
                type="date"
                value={achatForm.date_debut}
                onChange={(e) => setAchatForm({ ...achatForm, date_debut: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Date de fin (optionnel)</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={achatForm.date_fin ?? ''}
                  onChange={(e) => setAchatForm({ ...achatForm, date_fin: e.target.value || null })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={savingAchat}
                  className="whitespace-nowrap rounded-md bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
                >
                  {savingAchat ? '…' : 'Ajouter'}
                </button>
              </div>
            </div>
            {achatError && <p className="col-span-full text-sm text-red-600">{achatError}</p>}
          </form>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Fournisseur</th>
                  <th className="px-4 py-3">Palier</th>
                  <th className="px-4 py-3 text-right">Prix</th>
                  <th className="px-4 py-3">Du</th>
                  <th className="px-4 py-3">Au</th>
                  <th className="px-4 py-3">Modifié par</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {achats.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{nomFournisseur(p.fournisseur_id)}</td>
                    <td className="px-4 py-3 text-slate-600">{PALIER_PRIX_LABELS[p.palier]}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">{formatGNF(p.prix)}</td>
                    <td className="px-4 py-3 text-slate-500">{formatShortDate(p.date_debut)}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {closingAchatId === p.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="date"
                            value={dateFinFermetureAchat}
                            onChange={(e) => setDateFinFermetureAchat(e.target.value)}
                            className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                          />
                          <button onClick={() => handleFermerAchat(p)} disabled={savingAchat} className="text-xs font-medium text-teal-700 hover:underline disabled:opacity-50">
                            OK
                          </button>
                          <button onClick={() => setClosingAchatId(null)} className="text-xs text-slate-400 hover:underline">✕</button>
                        </div>
                      ) : p.date_fin ? (
                        formatShortDate(p.date_fin)
                      ) : (
                        <Badge tone="success">en cours</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{p.modifie_par}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {!p.date_fin && closingAchatId !== p.id && (
                          <button onClick={() => openFermetureAchat(p)} className="text-xs font-medium text-teal-700 hover:underline">
                            Fermer
                          </button>
                        )}
                        <button
                          onClick={() => handleSupprimerAchat(p)}
                          disabled={deletingAchatId === p.id}
                          className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                        >
                          Suppr.
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {achats.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-400">
                      Aucun prix d'achat enregistré.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

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
