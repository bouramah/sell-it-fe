import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { api, SERVER_BASE } from '../api/client'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import SearchableSelect from '../components/SearchableSelect'
import SearchInput from '../components/SearchInput'
import { SpinnerBloc } from '../components/Spinner'
import { formatGNF } from '../lib/format'
import { useBoutiques } from '../lib/useBoutiques'
import { usePagination } from '../lib/usePagination'
import { usePermissions } from '../lib/permissions'
import { useSearch } from '../lib/useSearch'
import type { Beneficiaire, Etablissement } from '../types'
import type { BeneficiaireInput, DemandeCreditBeneficiaireInput } from '../types/write'

const EMPTY_FORM: BeneficiaireInput = { nom: '', contact: '', boutique_ids: [], etablissement_id: '', poste: '', salaire_reference: 0 }

export default function Beneficiaires() {
  const [beneficiaires, setBeneficiaires] = useState<Beneficiaire[]>([])
  const [etablissements, setEtablissements] = useState<Etablissement[]>([])
  const [postes, setPostes] = useState<string[]>([])
  const [etablissementFiltre, setEtablissementFiltre] = useState('')
  const [loading, setLoading] = useState(true)
  const { boutiques } = useBoutiques()
  const { beneficiaireGestion: canGerer } = usePermissions()

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Beneficiaire | null>(null)
  const [form, setForm] = useState<BeneficiaireInput>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [demandant, setDemandant] = useState<Beneficiaire | null>(null)
  const [demandeForm, setDemandeForm] = useState<DemandeCreditBeneficiaireInput>({ boutique_id: '', montant_souhaite: 0, motif: '' })
  const [demandeError, setDemandeError] = useState<string | null>(null)
  const [demandeSaving, setDemandeSaving] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadTargetRef = useRef<string | null>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [telechargeantId, setTelechargeantId] = useState<string | null>(null)

  function refresh() {
    setLoading(true)
    Promise.all([
      api.beneficiaires(etablissementFiltre || undefined).then(setBeneficiaires),
      api.etablissements().then(setEtablissements),
      api.referentiels().then((r) => setPostes((r.postes_beneficiaires ?? []).map((p) => p.nom))),
    ]).finally(() => setLoading(false))
  }

  useEffect(refresh, [etablissementFiltre])

  const nomEtablissement = useCallback((id: string) => etablissements.find((e) => e.id === id)?.nom ?? id, [etablissements])
  const getFields = useCallback((b: Beneficiaire) => [b.client_nom, b.client_contact, b.numero_membre, nomEtablissement(b.etablissement_id), b.poste], [nomEtablissement])
  const { query, setQuery, filtered } = useSearch(beneficiaires, getFields)
  const { page, setPage, pageCount, paginated, totalItems, pageSize } = usePagination(filtered)

  function openCreate() {
    setForm(EMPTY_FORM)
    setError(null)
    setCreating(true)
  }

  function openEdit(b: Beneficiaire) {
    setForm({ client_id: b.client_id, etablissement_id: b.etablissement_id, poste: b.poste, salaire_reference: b.salaire_reference ?? 0 })
    setError(null)
    setEditing(b)
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault()
    if (!form.etablissement_id || !form.poste) {
      setError('Établissement et poste sont requis.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (editing) {
        await api.modifierBeneficiaire(editing.id, {
          etablissement_id: form.etablissement_id, poste: form.poste, salaire_reference: form.salaire_reference,
        })
      } else {
        await api.creerBeneficiaire(form)
      }
      setCreating(false)
      setEditing(null)
      refresh()
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Échec de l'enregistrement.")
    } finally {
      setSaving(false)
    }
  }

  function openFilePicker(b: Beneficiaire) {
    uploadTargetRef.current = b.id
    fileInputRef.current?.click()
  }

  async function handleFileSelected(ev: ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0]
    const targetId = uploadTargetRef.current
    ev.target.value = ''
    if (!file || !targetId) return
    setUploadingId(targetId)
    try {
      await api.uploaderEngagementBeneficiaire(targetId, file)
      refresh()
    } finally {
      setUploadingId(null)
    }
  }

  async function handleRemoveEngagement(b: Beneficiaire) {
    setUploadingId(b.id)
    try {
      await api.supprimerEngagementBeneficiaire(b.id)
      refresh()
    } finally {
      setUploadingId(null)
    }
  }

  async function handleTelechargerCarte(b: Beneficiaire) {
    setTelechargeantId(b.id)
    try {
      await api.telechargerCarteMembre(b.id)
    } finally {
      setTelechargeantId(null)
    }
  }

  function openDemande(b: Beneficiaire) {
    setDemandant(b)
    setDemandeForm({ boutique_id: '', montant_souhaite: 0, motif: '' })
    setDemandeError(null)
  }

  async function handleSubmitDemande(ev: FormEvent) {
    ev.preventDefault()
    if (!demandant) return
    setDemandeSaving(true)
    setDemandeError(null)
    try {
      await api.creerDemandeCreditBeneficiaire(demandant.id, demandeForm)
      setDemandant(null)
      refresh()
    } catch (err) {
      setDemandeError(err instanceof Error && err.message ? err.message : 'Échec de la demande.')
    } finally {
      setDemandeSaving(false)
    }
  }

  const showModal = creating || editing !== null

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bénéficiaires</h1>
          <p className="text-sm text-slate-500">Aide Humanitaire — fiches, engagement signé, plafond de crédit</p>
        </div>
        {canGerer && (
          <button onClick={openCreate} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
            + Ajouter un bénéficiaire
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un bénéficiaire…" />
        <div className="w-56">
          <SearchableSelect
            value={etablissementFiltre}
            onChange={setEtablissementFiltre}
            options={etablissements.map((e) => ({ value: e.id, label: e.nom }))}
            allowEmpty="Tous les établissements"
            placeholder="Tous les établissements"
          />
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleFileSelected} />

      {loading && beneficiaires.length === 0 ? (
        <SpinnerBloc />
      ) : (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Bénéficiaire</th>
              <th className="px-4 py-3">N° membre</th>
              <th className="px-4 py-3">Établissement</th>
              <th className="px-4 py-3">Poste</th>
              <th className="px-4 py-3">Engagement</th>
              <th className="px-4 py-3 text-right">Plafond disponible</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {b.client_nom}
                  <div className="text-xs font-normal text-slate-400">{b.client_contact}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">{b.numero_membre}</td>
                <td className="px-4 py-3 text-slate-600">{nomEtablissement(b.etablissement_id)}</td>
                <td className="px-4 py-3 text-slate-600">{b.poste}</td>
                <td className="px-4 py-3">
                  {b.engagement_signe_url ? (
                    <div className="flex items-center gap-2">
                      <a href={`${SERVER_BASE}${b.engagement_signe_url}`} target="_blank" rel="noreferrer" className="font-medium text-teal-700 hover:underline">
                        Voir
                      </a>
                      {canGerer && (
                        <button onClick={() => handleRemoveEngagement(b)} disabled={uploadingId === b.id} className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50">
                          Retirer
                        </button>
                      )}
                    </div>
                  ) : canGerer ? (
                    <button onClick={() => openFilePicker(b)} disabled={uploadingId === b.id} className="font-medium text-teal-700 hover:underline disabled:opacity-50">
                      {uploadingId === b.id ? 'Envoi…' : '+ Ajouter'}
                    </button>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {b.plafond_suspendu ? (
                    <Badge tone="danger">Suspendu</Badge>
                  ) : (
                    <span className="font-medium text-slate-900">{formatGNF(b.plafond_disponible)}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {canGerer && (
                    <div className="flex flex-wrap gap-3">
                      <button onClick={() => openEdit(b)} className="font-medium text-teal-700 hover:underline">
                        Modifier
                      </button>
                      <button
                        onClick={() => openDemande(b)}
                        disabled={!b.credit_autorise || b.plafond_suspendu}
                        className="font-medium text-teal-700 hover:underline disabled:cursor-not-allowed disabled:text-slate-300 disabled:no-underline"
                      >
                        Demander un crédit
                      </button>
                      <button
                        onClick={() => handleTelechargerCarte(b)}
                        disabled={telechargeantId === b.id}
                        className="font-medium text-teal-700 hover:underline disabled:opacity-50"
                      >
                        {telechargeantId === b.id ? 'Génération…' : 'Carte de membre'}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-400">
                  Aucun bénéficiaire.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination page={page} pageCount={pageCount} onChange={setPage} totalItems={totalItems} pageSize={pageSize} />
      </div>
      )}

      {showModal && (
        <Modal title={editing ? 'Modifier le bénéficiaire' : 'Ajouter un bénéficiaire'} onClose={() => { setCreating(false); setEditing(null) }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editing && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Nom</label>
                  <input
                    value={form.nom ?? ''}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Contact téléphonique</label>
                  <input
                    value={form.contact ?? ''}
                    onChange={(e) => setForm({ ...form, contact: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    placeholder="620 00 00 00"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Boutique(s) fréquentée(s)</label>
                  <div className="flex flex-wrap gap-3">
                    {boutiques.map((bt) => (
                      <label key={bt.id} className="flex items-center gap-1.5 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={(form.boutique_ids ?? []).includes(bt.id)}
                          onChange={() =>
                            setForm((f) => ({
                              ...f,
                              boutique_ids: (f.boutique_ids ?? []).includes(bt.id)
                                ? (f.boutique_ids ?? []).filter((x) => x !== bt.id)
                                : [...(f.boutique_ids ?? []), bt.id],
                            }))
                          }
                        />
                        {bt.nom}
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Établissement de rattachement</label>
              <SearchableSelect
                value={form.etablissement_id}
                onChange={(v) => setForm({ ...form, etablissement_id: v })}
                options={etablissements.map((e) => ({ value: e.id, label: e.nom }))}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Poste</label>
              <SearchableSelect
                value={form.poste}
                onChange={(v) => setForm({ ...form, poste: v })}
                options={postes.map((p) => ({ value: p, label: p }))}
                placeholder="Sélectionner un poste…"
                required
              />
              <p className="mt-1 text-xs text-slate-400">
                Géré depuis Paramètres → Référentiels → « postes_beneficiaires ».
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Salaire de référence (GNF)</label>
              <input
                type="number"
                min={1}
                value={form.salaire_reference}
                onChange={(e) => setForm({ ...form, salaire_reference: Number(e.target.value) })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setCreating(false); setEditing(null) }} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Annuler
              </button>
              <button type="submit" disabled={saving} className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
                {saving ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Ajouter'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {demandant && (
        <Modal title={`Demande de crédit — ${demandant.client_nom}`} onClose={() => setDemandant(null)}>
          <form onSubmit={handleSubmitDemande} className="space-y-4">
            <p className="text-sm text-slate-600">
              Plafond disponible : <span className="font-semibold text-slate-900">{formatGNF(demandant.plafond_disponible)}</span>
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Boutique</label>
              <SearchableSelect
                value={demandeForm.boutique_id}
                onChange={(v) => setDemandeForm({ ...demandeForm, boutique_id: v })}
                options={boutiques.map((b) => ({ value: b.id, label: b.nom }))}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Montant souhaité (GNF)</label>
              <input
                type="number"
                min={1}
                max={demandant.plafond_disponible}
                value={demandeForm.montant_souhaite}
                onChange={(e) => setDemandeForm({ ...demandeForm, montant_souhaite: Number(e.target.value) })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Motif</label>
              <input
                value={demandeForm.motif}
                onChange={(e) => setDemandeForm({ ...demandeForm, motif: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <p className="text-xs text-slate-400">
              Un lien de validation par SMS sera envoyé au garant référent et au garant comptabilité de
              l'établissement — le crédit ne s'active qu'une fois les deux validations obtenues.
            </p>
            {demandeError && <p className="text-sm text-red-600">{demandeError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setDemandant(null)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Annuler
              </button>
              <button type="submit" disabled={demandeSaving} className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
                {demandeSaving ? 'Envoi…' : 'Envoyer aux garants'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
