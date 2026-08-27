import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { api, SERVER_BASE } from '../api/client'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import SearchableSelect from '../components/SearchableSelect'
import SearchInput from '../components/SearchInput'
import { formatGNF } from '../lib/format'
import { useBoutiques } from '../lib/useBoutiques'
import { usePagination } from '../lib/usePagination'
import { usePermissions } from '../lib/permissions'
import { useSearch } from '../lib/useSearch'
import type { Ecole, Enseignant } from '../types'
import type { DemandeCreditEnseignantInput, EnseignantInput } from '../types/write'

const EMPTY_FORM: EnseignantInput = { nom: '', contact: '', boutique_ids: [], ecole_id: '', grade_echelon: '', salaire_reference: 0 }

export default function Enseignants() {
  const [enseignants, setEnseignants] = useState<Enseignant[]>([])
  const [ecoles, setEcoles] = useState<Ecole[]>([])
  const [grades, setGrades] = useState<string[]>([])
  const [ecoleFiltre, setEcoleFiltre] = useState('')
  const { boutiques } = useBoutiques()
  const { enseignantGestion: canGerer } = usePermissions()

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Enseignant | null>(null)
  const [form, setForm] = useState<EnseignantInput>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [demandant, setDemandant] = useState<Enseignant | null>(null)
  const [demandeForm, setDemandeForm] = useState<DemandeCreditEnseignantInput>({ boutique_id: '', montant_souhaite: 0, motif: '' })
  const [demandeError, setDemandeError] = useState<string | null>(null)
  const [demandeSaving, setDemandeSaving] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadTargetRef = useRef<string | null>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  function refresh() {
    api.enseignants(ecoleFiltre || undefined).then(setEnseignants)
    api.ecoles().then(setEcoles)
    api.referentiels().then((r) => setGrades((r.grades_enseignants ?? []).map((g) => g.nom)))
  }

  useEffect(refresh, [ecoleFiltre])

  const nomEcole = useCallback((id: string) => ecoles.find((e) => e.id === id)?.nom ?? id, [ecoles])
  const getFields = useCallback((e: Enseignant) => [e.client_nom, e.client_contact, nomEcole(e.ecole_id), e.grade_echelon], [nomEcole])
  const { query, setQuery, filtered } = useSearch(enseignants, getFields)
  const { page, setPage, pageCount, paginated, totalItems, pageSize } = usePagination(filtered)

  function openCreate() {
    setForm(EMPTY_FORM)
    setError(null)
    setCreating(true)
  }

  function openEdit(e: Enseignant) {
    setForm({ client_id: e.client_id, ecole_id: e.ecole_id, grade_echelon: e.grade_echelon, salaire_reference: e.salaire_reference ?? 0 })
    setError(null)
    setEditing(e)
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault()
    if (!form.ecole_id || !form.grade_echelon) {
      setError('École et grade/échelon sont requis.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (editing) {
        await api.modifierEnseignant(editing.id, {
          ecole_id: form.ecole_id, grade_echelon: form.grade_echelon, salaire_reference: form.salaire_reference,
        })
      } else {
        await api.creerEnseignant(form)
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

  function openFilePicker(e: Enseignant) {
    uploadTargetRef.current = e.id
    fileInputRef.current?.click()
  }

  async function handleFileSelected(ev: ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0]
    const targetId = uploadTargetRef.current
    ev.target.value = ''
    if (!file || !targetId) return
    setUploadingId(targetId)
    try {
      await api.uploaderEngagementEnseignant(targetId, file)
      refresh()
    } finally {
      setUploadingId(null)
    }
  }

  async function handleRemoveEngagement(e: Enseignant) {
    setUploadingId(e.id)
    try {
      await api.supprimerEngagementEnseignant(e.id)
      refresh()
    } finally {
      setUploadingId(null)
    }
  }

  function openDemande(e: Enseignant) {
    setDemandant(e)
    setDemandeForm({ boutique_id: '', montant_souhaite: 0, motif: '' })
    setDemandeError(null)
  }

  async function handleSubmitDemande(ev: FormEvent) {
    ev.preventDefault()
    if (!demandant) return
    setDemandeSaving(true)
    setDemandeError(null)
    try {
      await api.creerDemandeCreditEnseignant(demandant.id, demandeForm)
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
          <h1 className="text-2xl font-bold text-slate-900">Enseignants bénéficiaires</h1>
          <p className="text-sm text-slate-500">Aide aux Enseignants — fiches, engagement signé, plafond de crédit</p>
        </div>
        {canGerer && (
          <button onClick={openCreate} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
            + Ajouter un enseignant
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un enseignant…" />
        <div className="w-56">
          <SearchableSelect
            value={ecoleFiltre}
            onChange={setEcoleFiltre}
            options={ecoles.map((e) => ({ value: e.id, label: e.nom }))}
            allowEmpty="Toutes les écoles"
            placeholder="Toutes les écoles"
          />
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleFileSelected} />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Enseignant</th>
              <th className="px-4 py-3">École</th>
              <th className="px-4 py-3">Grade / échelon</th>
              <th className="px-4 py-3">Engagement</th>
              <th className="px-4 py-3 text-right">Plafond disponible</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {e.client_nom}
                  <div className="text-xs font-normal text-slate-400">{e.client_contact}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">{nomEcole(e.ecole_id)}</td>
                <td className="px-4 py-3 text-slate-600">{e.grade_echelon}</td>
                <td className="px-4 py-3">
                  {e.engagement_signe_url ? (
                    <div className="flex items-center gap-2">
                      <a href={`${SERVER_BASE}${e.engagement_signe_url}`} target="_blank" rel="noreferrer" className="font-medium text-teal-700 hover:underline">
                        Voir
                      </a>
                      {canGerer && (
                        <button onClick={() => handleRemoveEngagement(e)} disabled={uploadingId === e.id} className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50">
                          Retirer
                        </button>
                      )}
                    </div>
                  ) : canGerer ? (
                    <button onClick={() => openFilePicker(e)} disabled={uploadingId === e.id} className="font-medium text-teal-700 hover:underline disabled:opacity-50">
                      {uploadingId === e.id ? 'Envoi…' : '+ Ajouter'}
                    </button>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {e.plafond_suspendu ? (
                    <Badge tone="danger">Suspendu</Badge>
                  ) : (
                    <span className="font-medium text-slate-900">{formatGNF(e.plafond_disponible)}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {canGerer && (
                    <div className="flex gap-3">
                      <button onClick={() => openEdit(e)} className="font-medium text-teal-700 hover:underline">
                        Modifier
                      </button>
                      <button
                        onClick={() => openDemande(e)}
                        disabled={!e.credit_autorise || e.plafond_suspendu}
                        className="font-medium text-teal-700 hover:underline disabled:cursor-not-allowed disabled:text-slate-300 disabled:no-underline"
                      >
                        Demander un crédit
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-400">
                  Aucun enseignant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination page={page} pageCount={pageCount} onChange={setPage} totalItems={totalItems} pageSize={pageSize} />
      </div>

      {showModal && (
        <Modal title={editing ? "Modifier l'enseignant" : 'Ajouter un enseignant'} onClose={() => { setCreating(false); setEditing(null) }}>
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
                    {boutiques.map((b) => (
                      <label key={b.id} className="flex items-center gap-1.5 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={(form.boutique_ids ?? []).includes(b.id)}
                          onChange={() =>
                            setForm((f) => ({
                              ...f,
                              boutique_ids: (f.boutique_ids ?? []).includes(b.id)
                                ? (f.boutique_ids ?? []).filter((x) => x !== b.id)
                                : [...(f.boutique_ids ?? []), b.id],
                            }))
                          }
                        />
                        {b.nom}
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">École de rattachement</label>
              <SearchableSelect
                value={form.ecole_id}
                onChange={(v) => setForm({ ...form, ecole_id: v })}
                options={ecoles.map((e) => ({ value: e.id, label: e.nom }))}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Grade / échelon</label>
              <SearchableSelect
                value={form.grade_echelon}
                onChange={(v) => setForm({ ...form, grade_echelon: v })}
                options={grades.map((g) => ({ value: g, label: g }))}
                placeholder="Sélectionner un grade…"
                required
              />
              <p className="mt-1 text-xs text-slate-400">
                Géré depuis Paramètres → Référentiels → « grades_enseignants ».
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
              Un lien de validation par SMS sera envoyé au garant référent et au garant comptabilité de l'école — le
              crédit ne s'active qu'une fois les deux validations obtenues.
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
