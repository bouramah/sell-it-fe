import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { api, SERVER_BASE } from '../api/client'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import SearchableSelect from '../components/SearchableSelect'
import SearchInput from '../components/SearchInput'
import { formatGNF, formatShortDate } from '../lib/format'
import { useBoutiques } from '../lib/useBoutiques'
import { useSearch } from '../lib/useSearch'
import {
  MODE_PAIEMENT_LABELS,
  STATUT_PAIEMENT_LABELS,
  type Fournisseur,
  type LigneCommandeFournisseur,
  type ModePaiement,
  type PaiementFournisseur,
  type StatutPaiement,
} from '../types'
import type { PaiementFournisseurInput } from '../types/write'

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
  mode_paiement: 'especes',
  montant: 0,
  date_paiement: null,
}

export default function PaiementsFournisseurs() {
  const [paiements, setPaiements] = useState<PaiementFournisseur[]>([])
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [commandes, setCommandes] = useState<LigneCommandeFournisseur[]>([])
  const { boutiques, nomBoutique } = useBoutiques()
  const [payingId, setPayingId] = useState<string | null>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadTargetRef = useRef<string | null>(null)

  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<PaiementFournisseurInput>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function refresh() {
    api.paiementsFournisseurs().then(setPaiements)
    api.commandesFournisseurs().then(setCommandes)
  }

  useEffect(refresh, [])
  useEffect(() => {
    api.fournisseurs().then(setFournisseurs)
  }, [])

  const getFields = useCallback((p: PaiementFournisseur) => [p.fournisseur_nom, p.reference], [])
  const { query, setQuery, filtered } = useSearch(paiements, getFields)

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
    setForm({ ...form, commande_id: commandeId || null, boutique_id: c ? c.boutique_id : form.boutique_id })
  }

  async function handleSubmitPaiement(e: FormEvent) {
    e.preventDefault()
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

  async function handlePayer(p: PaiementFournisseur) {
    setPayingId(p.id)
    try {
      await api.payerPaiementFournisseur(p.id)
      refresh()
    } finally {
      setPayingId(null)
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
        <button onClick={openCreate} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
          + Enregistrer un paiement
        </button>
      </div>

      <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un paiement…" />

      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleFileSelected} />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Fournisseur</th>
              <th className="px-4 py-3">Commande liée</th>
              <th className="px-4 py-3">Boutique</th>
              <th className="px-4 py-3">Mode de paiement</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Montant</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Facture / reçu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{p.fournisseur_nom}</td>
                <td className="px-4 py-3 text-slate-600">{p.reference}</td>
                <td className="px-4 py-3 text-slate-600">{nomBoutique(p.boutique_id)}</td>
                <td className="px-4 py-3 text-slate-600">{MODE_PAIEMENT_LABELS[p.mode_paiement]}</td>
                <td className="px-4 py-3 text-slate-500">{formatShortDate(p.date)}</td>
                <td className="px-4 py-3 text-right text-slate-900">{formatGNF(p.montant)}</td>
                <td className="px-4 py-3">
                  <Badge tone={TONE[p.statut]}>{STATUT_PAIEMENT_LABELS[p.statut]}</Badge>
                  {(p.statut === 'en_attente' || p.statut === 'partiel') && (
                    <button
                      onClick={() => handlePayer(p)}
                      disabled={payingId === p.id}
                      className="ml-2 text-xs font-medium text-teal-700 hover:underline disabled:opacity-50"
                    >
                      {payingId === p.id ? 'Règlement…' : 'Marquer payé'}
                    </button>
                  )}
                </td>
                <td className="px-4 py-3">
                  {p.document_url ? (
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
      </div>
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
                onChange={(v) => setForm({ ...form, boutique_id: v })}
                options={boutiques.map((b) => ({ value: b.id, label: b.nom }))}
                required
              />
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
    </div>
  )
}
