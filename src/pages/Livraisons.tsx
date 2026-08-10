import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { api, SERVER_BASE } from '../api/client'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import SearchableSelect from '../components/SearchableSelect'
import SearchInput from '../components/SearchInput'
import { useBoutiques } from '../lib/useBoutiques'
import { useSearch } from '../lib/useSearch'
import { STATUT_LIVRAISON_LABELS, type CommandeClient, type Livraison, type ReferentielItem, type StatutLivraison } from '../types'
import type { LivraisonInput } from '../types/write'

const STATUT_TONE: Record<StatutLivraison, 'default' | 'success' | 'warning' | 'danger'> = {
  preparee: 'default',
  en_cours: 'warning',
  livree: 'success',
  echec: 'danger',
}

const STATUTS: StatutLivraison[] = ['preparee', 'en_cours', 'livree', 'echec']

const EMPTY_FORM: LivraisonInput = { commande_id: '', livreur: '', boutique_id: '', adresse: '', creneau: '' }

export default function Livraisons() {
  const [livraisons, setLivraisons] = useState<Livraison[]>([])
  const [commandes, setCommandes] = useState<CommandeClient[]>([])
  const [boutiqueId, setBoutiqueId] = useState('')
  const { boutiques, nomBoutique } = useBoutiques()
  const [livreursRef, setLivreursRef] = useState<ReferentielItem[]>([])
  const [quartiersRef, setQuartiersRef] = useState<ReferentielItem[]>([])

  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<LivraisonInput>(EMPTY_FORM)
  const [livreurManuel, setLivreurManuel] = useState(false)
  const [quartier, setQuartier] = useState('')
  const [details, setDetails] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadTargetRef = useRef<string | null>(null)

  function refresh() {
    api.livraisons().then(setLivraisons)
    api.commandesClients().then(setCommandes)
  }

  useEffect(refresh, [])
  useEffect(() => {
    api.referentiels().then((r) => {
      setLivreursRef(r.livreurs ?? [])
      setQuartiersRef(r.quartiers ?? [])
    })
  }, [])

  const preFiltrees = boutiqueId ? livraisons.filter((l) => l.boutique_id === boutiqueId) : livraisons
  const getFields = useCallback((l: Livraison) => [l.commande_id, l.livreur, l.adresse], [])
  const { query, setQuery, filtered } = useSearch(preFiltrees, getFields)

  const commandesLivrables = commandes.filter((c) => c.statut !== 'annulee' && c.statut !== 'livree')

  function openCreate() {
    setForm(EMPTY_FORM)
    setLivreurManuel(false)
    setQuartier('')
    setDetails('')
    setError(null)
    setCreating(true)
  }

  function selectCommande(commandeId: string) {
    const c = commandes.find((x) => x.id === commandeId)
    setForm({ ...form, commande_id: commandeId, boutique_id: c ? c.boutique_id : form.boutique_id })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!quartier) {
      setError('Le quartier est obligatoire.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const adresse = details ? `${quartier} — ${details}` : quartier
      await api.creerLivraison({ ...form, adresse })
      setCreating(false)
      refresh()
    } catch {
      setError("Échec de l'affectation de la livraison.")
    } finally {
      setSaving(false)
    }
  }

  async function handleStatutChange(l: Livraison, statut: StatutLivraison) {
    await api.modifierStatutLivraison(l.id, statut)
    refresh()
  }

  function openFilePicker(l: Livraison) {
    uploadTargetRef.current = l.id
    fileInputRef.current?.click()
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const targetId = uploadTargetRef.current
    e.target.value = ''
    if (!file || !targetId) return
    setUploadingId(targetId)
    try {
      await api.uploaderPreuveLivraison(targetId, file)
      refresh()
    } finally {
      setUploadingId(null)
    }
  }

  async function handleRemovePreuve(l: Livraison) {
    setUploadingId(l.id)
    try {
      await api.supprimerPreuveLivraison(l.id)
      refresh()
    } finally {
      setUploadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Livraisons</h1>
          <p className="text-sm text-slate-500">Affectation des livreurs et suivi des tournées</p>
        </div>
        <button onClick={openCreate} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
          + Affecter une livraison
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Rechercher une livraison…" />
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

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Commande</th>
              <th className="px-4 py-3">Livreur</th>
              <th className="px-4 py-3">Boutique</th>
              <th className="px-4 py-3">Adresse / quartier</th>
              <th className="px-4 py-3">Créneau</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Preuve</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">#{l.commande_id}</td>
                <td className="px-4 py-3 text-slate-600">{l.livreur || <span className="text-slate-400">Non affecté</span>}</td>
                <td className="px-4 py-3 text-slate-600">{nomBoutique(l.boutique_id)}</td>
                <td className="px-4 py-3 text-slate-600">{l.adresse}</td>
                <td className="px-4 py-3 text-slate-500">{l.creneau}</td>
                <td className="px-4 py-3">
                  <div className="w-36">
                    <SearchableSelect
                      value={l.statut}
                      onChange={(v) => handleStatutChange(l, v as StatutLivraison)}
                      options={STATUTS.map((s) => ({ value: s, label: STATUT_LIVRAISON_LABELS[s] }))}
                    />
                  </div>
                  <div className="mt-1">
                    <Badge tone={STATUT_TONE[l.statut]}>{STATUT_LIVRAISON_LABELS[l.statut]}</Badge>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {l.preuve_url ? (
                    <div className="flex items-center gap-2">
                      <a href={`${SERVER_BASE}${l.preuve_url}`} target="_blank" rel="noreferrer" className="font-medium text-teal-700 hover:underline">
                        Voir
                      </a>
                      <button
                        onClick={() => openFilePicker(l)}
                        disabled={uploadingId === l.id}
                        className="text-xs font-medium text-slate-500 hover:underline disabled:opacity-50"
                      >
                        Remplacer
                      </button>
                      <button
                        onClick={() => handleRemovePreuve(l)}
                        disabled={uploadingId === l.id}
                        className="text-slate-400 hover:text-red-600 disabled:opacity-50"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => openFilePicker(l)}
                      disabled={uploadingId === l.id}
                      className="font-medium text-teal-700 hover:underline disabled:opacity-50"
                    >
                      {uploadingId === l.id ? 'Envoi…' : 'Ajouter'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-400">
                  Aucune livraison.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {creating && (
        <Modal title="Affecter une livraison" onClose={() => setCreating(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Commande client</label>
              <SearchableSelect
                value={form.commande_id}
                onChange={selectCommande}
                options={commandesLivrables.map((c) => ({ value: c.id, label: `#${c.id} — ${c.client_nom}` }))}
                required
              />
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
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">Livreur (optionnel)</label>
                <button
                  type="button"
                  onClick={() => {
                    setLivreurManuel((m) => !m)
                    setForm({ ...form, livreur: '' })
                  }}
                  className="text-xs font-medium text-teal-700 hover:underline"
                >
                  {livreurManuel ? 'Choisir dans la liste' : 'Saisir manuellement'}
                </button>
              </div>
              {livreurManuel ? (
                <input
                  value={form.livreur}
                  onChange={(e) => setForm({ ...form, livreur: e.target.value })}
                  placeholder="Nom du livreur"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              ) : (
                <SearchableSelect
                  value={form.livreur}
                  onChange={(v) => setForm({ ...form, livreur: v })}
                  options={livreursRef.map((l) => ({ value: l.nom, label: l.nom }))}
                  allowEmpty="Non affecté"
                  placeholder="Non affecté"
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Quartier</label>
                <SearchableSelect
                  value={quartier}
                  onChange={setQuartier}
                  options={quartiersRef.map((q) => ({ value: q.nom, label: q.nom }))}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Détails (repère, numéro…)</label>
                <input
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Ex : près du marché, maison bleue"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Créneau</label>
              <input
                value={form.creneau}
                onChange={(e) => setForm({ ...form, creneau: e.target.value })}
                placeholder="Ex : Aujourd'hui, 14h-18h"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setCreating(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Annuler
              </button>
              <button type="submit" disabled={saving} className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
                {saving ? 'Affectation…' : 'Affecter'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
