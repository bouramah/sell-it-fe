import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { api, SERVER_BASE } from '../api/client'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import SearchableSelect from '../components/SearchableSelect'
import SearchInput from '../components/SearchInput'
import { SpinnerBloc } from '../components/Spinner'
import { formatGNF, formatShortDate } from '../lib/format'
import { useBoutiques } from '../lib/useBoutiques'
import { usePagination } from '../lib/usePagination'
import { usePermissions } from '../lib/permissions'
import { useSearch } from '../lib/useSearch'
import {
  MODE_PAIEMENT_LABELS,
  STATUT_PAIEMENT_LABELS,
  type Caisse,
  type Fournisseur,
  type LigneCommandeFournisseur,
  type ModePaiement,
  type PaiementFournisseur,
  type StatutPaiement,
} from '../types'
import type { PaiementCaisseInput, PaiementFournisseurInput } from '../types/write'

const TONE: Record<StatutPaiement, 'success' | 'warning' | 'default'> = {
  encaisse: 'success',
  en_attente: 'warning',
  paye: 'success',
  partiel: 'warning',
}

const MODES_PAIEMENT: ModePaiement[] = ['especes', 'mobile_money', 'a_la_livraison', 'credit_client', 'virement', 'lettre_change']

const EMPTY_FORM: PaiementFournisseurInput = {
  fournisseur_nom: '',
  commande_id: null,
  boutique_id: '',
  caisse_id: '',
  mode_paiement: 'especes',
  montant: 0,
  date_paiement: null,
}

export default function PaiementsFournisseurs() {
  const [paiements, setPaiements] = useState<PaiementFournisseur[]>([])
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [commandes, setCommandes] = useState<LigneCommandeFournisseur[]>([])
  const [caisses, setCaisses] = useState<Caisse[]>([])
  const [boutiqueId, setBoutiqueId] = useState('')
  const { boutiques, nomBoutique } = useBoutiques()
  const { encaissement: canPayer } = usePermissions()
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadTargetRef = useRef<string | null>(null)

  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<PaiementFournisseurInput>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [payant, setPayant] = useState<PaiementFournisseur | null>(null)
  const [payerCaisseId, setPayerCaisseId] = useState('')
  const [payerError, setPayerError] = useState<string | null>(null)
  const [payerSaving, setPayerSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  function refresh() {
    setLoading(true)
    Promise.all([
      api.paiementsFournisseurs(boutiqueId || undefined).then(setPaiements),
      api.commandesFournisseurs().then(setCommandes),
      api.caisses().then(setCaisses),
    ]).finally(() => setLoading(false))
  }

  useEffect(refresh, [boutiqueId])
  useEffect(() => {
    api.fournisseurs().then(setFournisseurs)
  }, [])

  const getFields = useCallback((p: PaiementFournisseur) => [p.fournisseur_nom, p.reference], [])
  const { query, setQuery, filtered } = useSearch(paiements, getFields)
  const { page, setPage, pageCount, paginated, totalItems, pageSize } = usePagination(filtered)

  const nomCaisse = useCallback(
    (id: string | null) => {
      if (!id) return '—'
      const c = caisses.find((x) => x.id === id)
      return c ? `${nomBoutique(c.boutique_id)} — ${c.libelle}` : id
    },
    [caisses, nomBoutique]
  )

  const caissesOuvertesForm = caisses.filter((c) => c.statut === 'ouverte' && (!form.boutique_id || c.boutique_id === form.boutique_id))
  const caissesOuvertesPayant = payant
    ? caisses.filter((c) => c.statut === 'ouverte' && c.boutique_id === payant.boutique_id)
    : []

  const fournisseurSelectionne = fournisseurs.find((f) => f.nom === form.fournisseur_nom)
  const commandesDuFournisseur = fournisseurSelectionne
    ? commandes.filter((c) => c.fournisseur_id === fournisseurSelectionne.id)
    : []

  const restant = useMemo(() => {
    if (!form.commande_id) return null
    const commande = commandes.find((c) => c.id === form.commande_id)
    if (!commande) return null
    const dejaPaye = paiements
      .filter((p) => p.reference === `#${form.commande_id}`)
      .reduce((sum, p) => sum + p.montant, 0)
    return commande.montant - dejaPaye
  }, [form.commande_id, commandes, paiements])

  function openCreate() {
    setForm(EMPTY_FORM)
    setError(null)
    setCreating(true)
  }

  function selectFournisseur(nom: string) {
    setForm({ ...form, fournisseur_nom: nom, commande_id: null })
  }

  function selectCommande(commandeId: string) {
    const c = commandes.find((x) => x.id === commandeId)
    setForm({
      ...form,
      commande_id: commandeId || null,
      boutique_id: c ? c.boutique_id : form.boutique_id,
      caisse_id: c && c.boutique_id !== form.boutique_id ? '' : form.caisse_id,
    })
  }

  async function handleSubmitPaiement(e: FormEvent) {
    e.preventDefault()
    if (!form.caisse_id) {
      setError('Sélectionnez la caisse depuis laquelle le paiement est réglé.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await api.creerPaiementFournisseur(form)
      setCreating(false)
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'enregistrement du paiement.")
    } finally {
      setSaving(false)
    }
  }

  function openPayer(p: PaiementFournisseur) {
    setPayerCaisseId('')
    setPayerError(null)
    setPayant(p)
  }

  async function handleSubmitPayer(e: FormEvent) {
    e.preventDefault()
    if (!payant) return
    if (!payerCaisseId) {
      setPayerError('Sélectionnez la caisse concernée.')
      return
    }
    setPayerSaving(true)
    setPayerError(null)
    try {
      const payload: PaiementCaisseInput = { caisse_id: payerCaisseId }
      await api.payerPaiementFournisseur(payant.id, payload)
      setPayant(null)
      refresh()
    } catch (err) {
      setPayerError(err instanceof Error ? err.message : "Échec du règlement.")
    } finally {
      setPayerSaving(false)
    }
  }

  function openFilePicker(p: PaiementFournisseur) {
    uploadTargetRef.current = p.id
    fileInputRef.current?.click()
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const targetId = uploadTargetRef.current
    e.target.value = ''
    if (!file || !targetId) return
    setUploadingId(targetId)
    try {
      await api.uploaderDocumentPaiementFournisseur(targetId, file)
      refresh()
    } finally {
      setUploadingId(null)
    }
  }

  async function handleRemoveDocument(p: PaiementFournisseur) {
    setUploadingId(p.id)
    try {
      await api.supprimerDocumentPaiementFournisseur(p.id)
      refresh()
    } finally {
      setUploadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Paiements fournisseurs</h1>
          <p className="text-sm text-slate-500">Règlements aux fournisseurs, avec justificatif</p>
        </div>
        {canPayer && (
          <button onClick={openCreate} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
            + Enregistrer un paiement
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un paiement…" />
        <div className="w-56">
          <SearchableSelect
            value={boutiqueId}
            onChange={setBoutiqueId}
            options={boutiques.map((b) => ({ value: b.id, label: b.nom }))}
            allowEmpty="Toutes les boutiques"
            placeholder="Toutes les boutiques"
          />
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleFileSelected} />

      {loading && paiements.length === 0 ? (
        <SpinnerBloc />
      ) : (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Fournisseur</th>
              <th className="px-4 py-3">Commande liée</th>
              <th className="px-4 py-3">Boutique</th>
              <th className="px-4 py-3">Caisse</th>
              <th className="px-4 py-3">Mode de paiement</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Montant</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Facture / reçu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{p.fournisseur_nom}</td>
                <td className="px-4 py-3 text-slate-600">{p.reference}</td>
                <td className="px-4 py-3 text-slate-600">{nomBoutique(p.boutique_id)}</td>
                <td className="px-4 py-3 text-slate-600">{nomCaisse(p.caisse_id)}</td>
                <td className="px-4 py-3 text-slate-600">{MODE_PAIEMENT_LABELS[p.mode_paiement]}</td>
                <td className="px-4 py-3 text-slate-500">{formatShortDate(p.date)}</td>
                <td className="px-4 py-3 text-right text-slate-900">{formatGNF(p.montant)}</td>
                <td className="px-4 py-3">
                  <Badge tone={TONE[p.statut]}>{STATUT_PAIEMENT_LABELS[p.statut]}</Badge>
                  {(p.statut === 'en_attente' || p.statut === 'partiel') && canPayer && (
                    <button
                      onClick={() => openPayer(p)}
                      className="ml-2 text-xs font-medium text-teal-700 hover:underline"
                    >
                      Marquer payé
                    </button>
                  )}
                </td>
                <td className="px-4 py-3">
                  {!canPayer ? (
                    p.document_url ? (
                      <a href={`${SERVER_BASE}${p.document_url}`} target="_blank" rel="noreferrer" className="font-medium text-teal-700 hover:underline">
                        Voir
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )
                  ) : p.document_url ? (
                    <div className="flex items-center gap-2">
                      <a href={`${SERVER_BASE}${p.document_url}`} target="_blank" rel="noreferrer" className="font-medium text-teal-700 hover:underline">
                        Voir
                      </a>
                      <button
                        onClick={() => handleRemoveDocument(p)}
                        disabled={uploadingId === p.id}
                        className="text-slate-400 hover:text-red-600 disabled:opacity-50"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => openFilePicker(p)}
                      disabled={uploadingId === p.id}
                      className="font-medium text-teal-700 hover:underline disabled:opacity-50"
                    >
                      {uploadingId === p.id ? 'Envoi…' : 'Joindre'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} pageCount={pageCount} onChange={setPage} totalItems={totalItems} pageSize={pageSize} />
      </div>
      )}
      <p className="text-xs text-slate-400">
        Un paiement « en attente » apparaît automatiquement dès qu'une commande fournisseur est intégralement
        réceptionnée, ou lors de l'encaissement d'un remboursement de dette fournisseur. Vous pouvez aussi en
        enregistrer un manuellement ci-dessus, en le liant ou non à une commande, puis joindre la facture ou le
        reçu remis par le fournisseur.
      </p>

      {creating && (
        <Modal title="Enregistrer un paiement fournisseur" onClose={() => setCreating(false)}>
          <form onSubmit={handleSubmitPaiement} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Fournisseur</label>
              <SearchableSelect
                value={form.fournisseur_nom}
                onChange={selectFournisseur}
                options={fournisseurs.map((f) => ({ value: f.nom, label: f.nom }))}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Commande liée (optionnel)</label>
              <SearchableSelect
                value={form.commande_id ?? ''}
                onChange={selectCommande}
                options={commandesDuFournisseur.map((c) => ({ value: c.id, label: `#${c.id} — ${formatGNF(c.montant)}` }))}
                allowEmpty="Paiement direct (aucune commande)"
                placeholder="Paiement direct (aucune commande)"
              />
              {restant !== null && (
                <p className="mt-1 text-xs text-slate-500">Solde restant sur cette commande : {formatGNF(restant)}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Boutique</label>
              <SearchableSelect
                value={form.boutique_id}
                onChange={(v) => setForm({ ...form, boutique_id: v, caisse_id: '' })}
                options={boutiques.map((b) => ({ value: b.id, label: b.nom }))}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Caisse (réglé depuis)</label>
              <SearchableSelect
                value={form.caisse_id}
                onChange={(v) => setForm({ ...form, caisse_id: v })}
                options={caissesOuvertesForm.map((c) => ({ value: c.id, label: `${nomBoutique(c.boutique_id)} — ${c.libelle}` }))}
                required
              />
              {form.boutique_id && caissesOuvertesForm.length === 0 && (
                <p className="mt-1 text-xs text-red-600">Aucune caisse ouverte pour cette boutique.</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Mode de paiement</label>
                <SearchableSelect
                  value={form.mode_paiement}
                  onChange={(v) => setForm({ ...form, mode_paiement: v as ModePaiement })}
                  options={MODES_PAIEMENT.map((m) => ({ value: m, label: MODE_PAIEMENT_LABELS[m] }))}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Montant (GNF)</label>
                <input
                  type="number"
                  min={1}
                  value={form.montant || ''}
                  onChange={(e) => setForm({ ...form, montant: Number(e.target.value) })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Date (optionnel — aujourd'hui par défaut)</label>
              <input
                type="date"
                value={form.date_paiement ?? ''}
                onChange={(e) => setForm({ ...form, date_paiement: e.target.value || null })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setCreating(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Annuler
              </button>
              <button type="submit" disabled={saving} className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {payant && (
        <Modal title={`Marquer payé — ${payant.fournisseur_nom}`} onClose={() => setPayant(null)}>
          <form onSubmit={handleSubmitPayer} className="space-y-4">
            <p className="text-sm text-slate-600">
              Montant à régler : <span className="font-semibold text-slate-900">{formatGNF(payant.montant)}</span>
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Caisse concernée</label>
              <SearchableSelect
                value={payerCaisseId}
                onChange={setPayerCaisseId}
                options={caissesOuvertesPayant.map((c) => ({ value: c.id, label: c.libelle }))}
                required
              />
              {caissesOuvertesPayant.length === 0 && (
                <p className="mt-1 text-xs text-red-600">Aucune caisse ouverte pour la boutique de ce paiement.</p>
              )}
            </div>
            {payerError && <p className="text-sm text-red-600">{payerError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setPayant(null)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Annuler
              </button>
              <button type="submit" disabled={payerSaving} className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
                {payerSaving ? 'Règlement…' : 'Marquer payé'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
