import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import SearchableSelect from '../components/SearchableSelect'
import SearchInput from '../components/SearchInput'
import StatCard from '../components/StatCard'
import Tabs from '../components/Tabs'
import { formatGNF, formatShortDate } from '../lib/format'
import { useBoutiques } from '../lib/useBoutiques'
import { useSearch } from '../lib/useSearch'
import {
  MODE_PAIEMENT_LABELS,
  STATUT_DETTE_LABELS,
  type Caisse,
  type Client,
  type Fournisseur,
  type LigneDette,
  type ModePaiement,
  type StatutDette,
  type TiersType,
  type Utilisateur,
} from '../types'
import type { DetteInput, RemboursementInput } from '../types/write'

const STATUT_TONE: Record<StatutDette, 'success' | 'warning' | 'danger'> = {
  en_cours: 'warning',
  en_retard: 'danger',
  soldee: 'success',
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export default function Dettes() {
  const [tiers, setTiers] = useState<TiersType>('client')
  const [dettes, setDettes] = useState<LigneDette[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [caisses, setCaisses] = useState<Caisse[]>([])
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([])
  const [boutiqueId, setBoutiqueId] = useState('')
  const { boutiques, nomBoutique } = useBoutiques()

  function refresh() {
    api.dettes(tiers).then(setDettes)
  }

  useEffect(refresh, [tiers])
  useEffect(() => {
    api.clients().then(setClients)
    api.fournisseurs().then(setFournisseurs)
    api.caisses().then(setCaisses)
    api.utilisateurs().then(setUtilisateurs)
  }, [])

  const preFiltrees = boutiqueId ? dettes.filter((d) => d.boutique_id === boutiqueId) : dettes
  const getFields = useCallback((d: LigneDette) => [d.tiers_nom], [])
  const { query, setQuery, filtered } = useSearch(preFiltrees, getFields)
  const totalRestant = filtered.reduce((sum, d) => sum + d.solde_restant, 0)
  const enRetard = filtered.filter((d) => d.statut === 'en_retard').length

  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<DetteInput>({ tiers_type: tiers, tiers_nom: '', boutique_id: '', montant_initial: 0, echeance: todayIso() })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function openCreate() {
    setForm({ tiers_type: tiers, tiers_nom: '', boutique_id: '', montant_initial: 0, echeance: todayIso() })
    setError(null)
    setCreating(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await api.creerDette(form)
      setCreating(false)
      refresh()
    } catch {
      setError('Échec de l\'enregistrement de la dette.')
    } finally {
      setSaving(false)
    }
  }

  const [encaissant, setEncaissant] = useState<LigneDette | null>(null)
  const [remb, setRemb] = useState<RemboursementInput>({ caisse_id: '', montant: 0, mode_paiement: 'especes', operateur: '' })
  const [rembError, setRembError] = useState<string | null>(null)
  const [rembSaving, setRembSaving] = useState(false)
  const [operateurManuel, setOperateurManuel] = useState(false)

  const caissesOuvertesEncaissant = encaissant
    ? caisses.filter((c) => c.statut === 'ouverte' && c.boutique_id === encaissant.boutique_id)
    : []

  function openEncaisser(d: LigneDette) {
    setRemb({ caisse_id: '', montant: d.solde_restant, mode_paiement: 'especes', operateur: '' })
    setRembError(null)
    setOperateurManuel(false)
    setEncaissant(d)
  }

  async function handleSubmitRemb(e: FormEvent) {
    e.preventDefault()
    if (!encaissant) return
    if (remb.montant <= 0 || remb.montant > encaissant.solde_restant) {
      setRembError('Le montant doit être positif et ne pas dépasser le solde restant.')
      return
    }
    if (!remb.caisse_id) {
      setRembError('Sélectionnez la caisse concernée.')
      return
    }
    setRembSaving(true)
    setRembError(null)
    try {
      await api.encaisserRemboursement(encaissant.id, remb)
      setEncaissant(null)
      refresh()
    } catch {
      setRembError('Échec de l\'encaissement.')
    } finally {
      setRembSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dettes & créances</h1>
          <p className="text-sm text-slate-500">
            {tiers === 'client' ? 'Suivi des impayés clients par boutique' : 'Suivi des dettes envers les fournisseurs'}
          </p>
        </div>
        <button onClick={openCreate} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
          + Enregistrer une dette
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          tabs={[
            { key: 'client', label: 'Créances clients' },
            { key: 'fournisseur', label: 'Dettes fournisseurs' },
          ]}
          active={tiers}
          onChange={(k) => setTiers(k as TiersType)}
        />
        <div className="flex flex-wrap gap-3">
          <SearchInput value={query} onChange={setQuery} placeholder={tiers === 'client' ? 'Rechercher un client…' : 'Rechercher un fournisseur…'} />
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
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={tiers === 'client' ? 'Total créances en cours' : 'Total dû aux fournisseurs'} value={formatGNF(totalRestant)} />
        <StatCard label="Échéances dépassées" value={`${enRetard} ${tiers === 'client' ? 'clients' : 'fournisseurs'}`} />
        <StatCard label={tiers === 'client' ? 'Comptes concernés' : 'Fournisseurs concernés'} value={String(new Set(filtered.map((d) => d.tiers_nom)).size)} />
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">{tiers === 'client' ? 'Client' : 'Fournisseur'}</th>
              <th className="px-4 py-3">Boutique</th>
              <th className="px-4 py-3 text-right">Montant initial</th>
              <th className="px-4 py-3 text-right">Solde restant</th>
              <th className="px-4 py-3">Échéance</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{d.tiers_nom}</td>
                <td className="px-4 py-3 text-slate-600">{nomBoutique(d.boutique_id)}</td>
                <td className="px-4 py-3 text-right text-slate-600">{formatGNF(d.montant_initial)}</td>
                <td className="px-4 py-3 text-right font-medium text-slate-900">{formatGNF(d.solde_restant)}</td>
                <td className="px-4 py-3 text-slate-500">{formatShortDate(d.echeance)}</td>
                <td className="px-4 py-3">
                  <Badge tone={STATUT_TONE[d.statut]}>{STATUT_DETTE_LABELS[d.statut]}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  {d.statut !== 'soldee' && (
                    <button
                      onClick={() => openEncaisser(d)}
                      className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Encaisser
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-400">
                  Aucune dette.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {creating && (
        <Modal title="Enregistrer une dette" onClose={() => setCreating(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
              <SearchableSelect
                value={form.tiers_type}
                onChange={(v) => setForm({ ...form, tiers_type: v as TiersType, tiers_nom: '' })}
                options={[
                  { value: 'client', label: 'Client (créance)' },
                  { value: 'fournisseur', label: 'Fournisseur (dette)' },
                ]}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{form.tiers_type === 'client' ? 'Client' : 'Fournisseur'}</label>
              <SearchableSelect
                value={form.tiers_nom}
                onChange={(v) => setForm({ ...form, tiers_nom: v })}
                options={(form.tiers_type === 'client' ? clients.map((c) => ({ nom: c.nom, contact: c.contact })) : fournisseurs.map((f) => ({ nom: f.nom, contact: f.contact }))).map(
                  ({ nom, contact }) => ({ value: nom, label: `${nom} — ${contact}` })
                )}
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Montant initial (GNF)</label>
                <input
                  type="number"
                  min={0}
                  value={form.montant_initial}
                  onChange={(e) => setForm({ ...form, montant_initial: Number(e.target.value) })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Échéance</label>
                <input
                  type="date"
                  value={form.echeance}
                  onChange={(e) => setForm({ ...form, echeance: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
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

      {encaissant && (
        <Modal title={`Encaisser — ${encaissant.tiers_nom}`} onClose={() => setEncaissant(null)}>
          <form onSubmit={handleSubmitRemb} className="space-y-4">
            <p className="text-sm text-slate-600">
              Solde restant : <span className="font-semibold text-slate-900">{formatGNF(encaissant.solde_restant)}</span>
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Montant encaissé (GNF)</label>
              <input
                type="number"
                min={0}
                max={encaissant.solde_restant}
                value={remb.montant}
                onChange={(e) => setRemb({ ...remb, montant: Number(e.target.value) })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Caisse concernée</label>
              <SearchableSelect
                value={remb.caisse_id}
                onChange={(v) => setRemb({ ...remb, caisse_id: v })}
                options={caissesOuvertesEncaissant.map((c) => ({ value: c.id, label: c.libelle }))}
                required
              />
              {caissesOuvertesEncaissant.length === 0 && (
                <p className="mt-1 text-xs text-red-600">Aucune caisse ouverte pour la boutique de cette dette.</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Mode de paiement</label>
              <SearchableSelect
                value={remb.mode_paiement}
                onChange={(v) => setRemb({ ...remb, mode_paiement: v as ModePaiement })}
                options={(Object.keys(MODE_PAIEMENT_LABELS) as ModePaiement[]).map((m) => ({ value: m, label: MODE_PAIEMENT_LABELS[m] }))}
                required
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">Opérateur</label>
                <button
                  type="button"
                  onClick={() => {
                    setOperateurManuel((m) => !m)
                    setRemb({ ...remb, operateur: '' })
                  }}
                  className="text-xs font-medium text-teal-700 hover:underline"
                >
                  {operateurManuel ? 'Choisir dans la liste' : 'Saisir manuellement'}
                </button>
              </div>
              {operateurManuel ? (
                <input
                  value={remb.operateur}
                  onChange={(e) => setRemb({ ...remb, operateur: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              ) : (
                <SearchableSelect
                  value={remb.operateur}
                  onChange={(v) => setRemb({ ...remb, operateur: v })}
                  options={utilisateurs.map((u) => ({ value: `${u.prenom} ${u.nom}`, label: `${u.prenom} ${u.nom} — ${u.contact}` }))}
                  required
                />
              )}
            </div>
            {rembError && <p className="text-sm text-red-600">{rembError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEncaissant(null)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Annuler
              </button>
              <button type="submit" disabled={rembSaving} className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
                {rembSaving ? 'Encaissement…' : 'Encaisser'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
