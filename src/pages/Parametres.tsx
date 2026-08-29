import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import ConfirmDialog from '../components/ConfirmDialog'
import Modal from '../components/Modal'
import SearchableSelect from '../components/SearchableSelect'
import { formatGNF } from '../lib/format'
import { usePermissions } from '../lib/permissions'
import type { BaremeCreditBeneficiaire, Etablissement, ParametreFiscal, ReferentielItem } from '../types'
import type { BaremeCreditBeneficiaireInput } from '../types/write'

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
  types_etablissement: 'Types d’établissement',
  postes_beneficiaires: 'Postes (Aide Humanitaire)',
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
  'types_etablissement',
  'postes_beneficiaires',
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
  const { referentiels: canGererReferentiels, securite: canGererFiscal, baremeCreditBeneficiaireGestion: canGererBareme } = usePermissions()

  const [fiscal, setFiscal] = useState<ParametreFiscal | null>(null)
  const [fiscalTaux, setFiscalTaux] = useState('18')
  const [fiscalActif, setFiscalActif] = useState(true)
  const [savingFiscal, setSavingFiscal] = useState(false)

  const [baremes, setBaremes] = useState<BaremeCreditBeneficiaire[]>([])
  const [etablissements, setEtablissements] = useState<Etablissement[]>([])
  const [creatingBareme, setCreatingBareme] = useState(false)
  const [baremeForm, setBaremeForm] = useState<BaremeCreditBeneficiaireInput>({ etablissement_id: null, poste: '', plafond: 0, date_debut: new Date().toISOString().slice(0, 10) })
  const [baremeError, setBaremeError] = useState<string | null>(null)
  const [savingBareme, setSavingBareme] = useState(false)
  const [confirmDeleteBareme, setConfirmDeleteBareme] = useState<BaremeCreditBeneficiaire | null>(null)

  function refresh() {
    api.referentiels().then(setReferentiels)
    api.parametreFiscal().then((p) => {
      setFiscal(p)
      setFiscalTaux(String(Math.round(p.taux * 100)))
      setFiscalActif(p.actif)
    })
    api.baremeCreditBeneficiaires().then(setBaremes)
    api.etablissements().then(setEtablissements)
  }

  useEffect(refresh, [])

  async function handleSubmitBareme(e: FormEvent) {
    e.preventDefault()
    setSavingBareme(true)
    setBaremeError(null)
    try {
      await api.creerBaremeCreditBeneficiaire(baremeForm)
      setCreatingBareme(false)
      refresh()
    } catch (err) {
      setBaremeError(err instanceof Error && err.message ? err.message : "Échec de l'enregistrement.")
    } finally {
      setSavingBareme(false)
    }
  }

  async function handleDeleteBareme(b: BaremeCreditBeneficiaire) {
    await api.supprimerBaremeCreditBeneficiaire(b.id)
    setConfirmDeleteBareme(null)
    refresh()
  }

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

  const items = referentiels[categorie] ?? []
  const nomEtablissement = (id: string | null) => (id ? etablissements.find((e) => e.id === id)?.nom ?? id : 'Réseau (par défaut)')

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
        {canGererReferentiels && categorie !== 'fiscalite' && categorie !== 'bareme_beneficiaires' && (
          <button
            onClick={openCreate}
            className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800"
          >
            + Ajouter
          </button>
        )}
      </div>

      <div className="flex items-start gap-6">
        <nav className="w-56 shrink-0 space-y-4">
          <div className="space-y-0.5">
            <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Référentiels</p>
            {CATEGORIE_ORDER.filter((c) => c in referentiels).map((c) => (
              <button
                key={c}
                onClick={() => setCategorie(c)}
                className={`block w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                  categorie === c ? 'bg-teal-700 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {CATEGORIE_LABELS[c] ?? c}
              </button>
            ))}
          </div>
          <div className="space-y-0.5 border-t border-slate-200 pt-3">
            <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Configuration avancée</p>
            {(['fiscalite', 'bareme_beneficiaires'] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCategorie(c)}
                className={`block w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                  categorie === c ? 'bg-teal-700 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {c === 'fiscalite' ? 'Fiscalité (TVA)' : 'Barème crédit Aide Humanitaire'}
              </button>
            ))}
          </div>
        </nav>

        <div className="min-w-0 flex-1 space-y-6">
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

      {categorie === 'bareme_beneficiaires' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="max-w-2xl text-xs text-slate-400">
              Plafond de crédit alimentaire accordé à un bénéficiaire selon son poste. Une ligne sans établissement
              (« Réseau ») sert de référence par défaut ; une ligne rattachée à un établissement la surcharge pour cet
              établissement si sa période couvre la date du jour.
            </p>
            {canGererBareme && (
              <button
                onClick={() => { setBaremeForm({ etablissement_id: null, poste: '', plafond: 0, date_debut: new Date().toISOString().slice(0, 10) }); setBaremeError(null); setCreatingBareme(true) }}
                className="shrink-0 rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800"
              >
                + Ajouter un barème
              </button>
            )}
          </div>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Poste</th>
                  <th className="px-4 py-3">Portée</th>
                  <th className="px-4 py-3 text-right">Plafond</th>
                  <th className="px-4 py-3">Période</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {baremes.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{b.poste}</td>
                    <td className="px-4 py-3 text-slate-600">{nomEtablissement(b.etablissement_id)}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">{formatGNF(b.plafond)}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {b.date_debut} → {b.date_fin ?? 'indéfini'}
                    </td>
                    <td className="px-4 py-3">
                      {canGererBareme && (
                        <button onClick={() => setConfirmDeleteBareme(b)} className="font-medium text-red-600 hover:underline">
                          Suppr.
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {baremes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                      Aucun barème configuré.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {categorie !== 'fiscalite' && categorie !== 'bareme_beneficiaires' && (
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
        </div>
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

      {confirmDelete && (
        <ConfirmDialog
          title="Supprimer l'élément"
          message={`Supprimer "${confirmDelete.nom}" ? Cette action est irréversible.`}
          confirmLabel="Supprimer"
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {creatingBareme && (
        <Modal title="Ajouter un barème de crédit Aide Humanitaire" onClose={() => setCreatingBareme(false)}>
          <form onSubmit={handleSubmitBareme} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Poste</label>
              <SearchableSelect
                value={baremeForm.poste}
                onChange={(v) => setBaremeForm({ ...baremeForm, poste: v })}
                options={(referentiels.postes_beneficiaires ?? []).map((p) => ({ value: p.nom, label: p.nom }))}
                placeholder="Sélectionner un poste…"
                required
              />
              <p className="mt-1 text-xs text-slate-400">Géré dans l'onglet « postes_beneficiaires » ci-dessus.</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Établissement (facultatif — vide = réseau)</label>
              <SearchableSelect
                value={baremeForm.etablissement_id ?? ''}
                onChange={(v) => setBaremeForm({ ...baremeForm, etablissement_id: v || null })}
                options={etablissements.map((e) => ({ value: e.id, label: e.nom }))}
                allowEmpty="Réseau (tous les établissements)"
                placeholder="Réseau (tous les établissements)"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Plafond (GNF)</label>
              <input
                type="number"
                min={1}
                value={baremeForm.plafond}
                onChange={(e) => setBaremeForm({ ...baremeForm, plafond: Number(e.target.value) })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Date de début</label>
                <input
                  type="date"
                  value={baremeForm.date_debut}
                  onChange={(e) => setBaremeForm({ ...baremeForm, date_debut: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Date de fin (facultatif)</label>
                <input
                  type="date"
                  value={baremeForm.date_fin ?? ''}
                  onChange={(e) => setBaremeForm({ ...baremeForm, date_fin: e.target.value || null })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            {baremeError && <p className="text-sm text-red-600">{baremeError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setCreatingBareme(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Annuler
              </button>
              <button type="submit" disabled={savingBareme} className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
                {savingBareme ? 'Enregistrement…' : 'Ajouter'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDeleteBareme && (
        <ConfirmDialog
          title="Supprimer le barème"
          message={`Supprimer le barème "${confirmDeleteBareme.poste}" (${nomEtablissement(confirmDeleteBareme.etablissement_id)}) ? Cette action est irréversible.`}
          confirmLabel="Supprimer"
          onConfirm={() => handleDeleteBareme(confirmDeleteBareme)}
          onCancel={() => setConfirmDeleteBareme(null)}
        />
      )}
    </div>
  )
}
