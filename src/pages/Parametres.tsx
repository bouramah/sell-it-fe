import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import ConfirmDialog from '../components/ConfirmDialog'
import Modal from '../components/Modal'
import Tabs from '../components/Tabs'
import { usePermissions } from '../lib/permissions'
import type { ParametreFiscal, ReferentielItem } from '../types'

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
  const [confirmDelete, setConfirmDelete] = useState<ReferentielItem | null>(null)
  const { referentiels: canGererReferentiels, securite: canGererFiscal } = usePermissions()

  const [fiscal, setFiscal] = useState<ParametreFiscal | null>(null)
  const [fiscalTaux, setFiscalTaux] = useState('18')
  const [fiscalActif, setFiscalActif] = useState(true)
  const [savingFiscal, setSavingFiscal] = useState(false)

  function refresh() {
    api.referentiels().then(setReferentiels)
    api.parametreFiscal().then((p) => {
      setFiscal(p)
      setFiscalTaux(String(Math.round(p.taux * 100)))
      setFiscalActif(p.actif)
    })
  }

  useEffect(refresh, [])

  async function handleSubmitFiscal(e: FormEvent) {
    e.preventDefault()
    setSavingFiscal(true)
    try {
      const p = await api.modifierParametreFiscal(Number(fiscalTaux) / 100, fiscalActif)
      setFiscal(p)
    } finally {
      setSavingFiscal(false)
    }
  }

  const categories = [...CATEGORIE_ORDER.filter((c) => c in referentiels), 'fiscalite']
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
    await api.supprimerReferentiel(categorie, item.id)
    setConfirmDelete(null)
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
        {canGererReferentiels && categorie !== 'fiscalite' && (
          <button
            onClick={openCreate}
            className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800"
          >
            + Ajouter
          </button>
        )}
      </div>

      <Tabs
        tabs={categories.map((c) => ({ key: c, label: CATEGORIE_LABELS[c] ?? (c === 'fiscalite' ? 'Fiscalité (TVA)' : c) }))}
        active={categorie}
        onChange={setCategorie}
      />

      {categorie === 'secteurs' && (
        <p className="text-xs text-slate-400">
          Les secteurs déterminent la classification des produits, boutiques et fournisseurs dans toute l'application.
        </p>
      )}

      {categorie === 'fiscalite' && (
        <div className="max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-600">TVA</h2>
          <p className="mb-4 text-xs text-slate-400">
            Les prix enregistrés dans KFSTORE sont toujours TTC. Ce réglage détermine si la ventilation HT / TVA
            apparaît sur les documents commerciaux (factures, reçus, bons de commande/réception).
          </p>
          <form onSubmit={handleSubmitFiscal} className="space-y-4">
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-700">Appliquer la TVA sur les documents</span>
              <input
                type="checkbox"
                checked={fiscalActif}
                disabled={!canGererFiscal}
                onChange={(e) => setFiscalActif(e.target.checked)}
                className="h-5 w-5 accent-teal-700"
              />
            </label>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Taux (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={fiscalTaux}
                disabled={!canGererFiscal || !fiscalActif}
                onChange={(e) => setFiscalTaux(e.target.value)}
                className="w-32 rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>
            {canGererFiscal && (
              <button
                type="submit"
                disabled={savingFiscal}
                className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
              >
                {savingFiscal ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            )}
            {fiscal && (
              <p className="text-xs text-slate-400">
                Actuellement : {fiscal.actif ? `TVA ${Math.round(fiscal.taux * 100)} % appliquée` : 'TVA non appliquée (documents en TTC seul)'}
              </p>
            )}
          </form>
        </div>
      )}

      {categorie !== 'fiscalite' && (
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400">Nom</div>
              <div className="font-medium text-slate-900">{item.nom}</div>
            </div>
            {canGererReferentiels && (
              <div className="flex gap-4 text-sm">
                <button onClick={() => openEdit(item)} className="font-medium text-teal-700 hover:underline">
                  Modifier
                </button>
                <button onClick={() => setConfirmDelete(item)} className="font-medium text-red-600 hover:underline">
                  Suppr.
                </button>
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-400">Aucun élément dans ce référentiel.</p>}
      </div>
      )}

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

      {confirmDelete && (
        <ConfirmDialog
          title="Supprimer l'élément"
          message={`Supprimer "${confirmDelete.nom}" ? Cette action est irréversible.`}
          confirmLabel="Supprimer"
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
