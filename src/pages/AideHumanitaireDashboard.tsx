import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import Modal from '../components/Modal'
import SearchableSelect from '../components/SearchableSelect'
import StatCard from '../components/StatCard'
import { formatGNF, formatShortDate } from '../lib/format'
import { usePermissions } from '../lib/permissions'
import type { Etablissement, SuiviEtablissement, VersementEtablissement } from '../types'
import type { VersementEtablissementInput } from '../types/write'

const EMPTY_FORM: VersementEtablissementInput = { etablissement_id: '', montant: 0, date: new Date().toISOString().slice(0, 10), reference: '' }

export default function AideHumanitaireDashboard() {
  const [suivi, setSuivi] = useState<SuiviEtablissement[]>([])
  const [versements, setVersements] = useState<VersementEtablissement[]>([])
  const [etablissements, setEtablissements] = useState<Etablissement[]>([])
  const { beneficiaireGestion: canGerer } = usePermissions()

  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<VersementEtablissementInput>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function refresh() {
    api.suiviAideHumanitaire().then(setSuivi)
    api.versementsEtablissements().then(setVersements)
    api.etablissements().then(setEtablissements)
  }

  useEffect(refresh, [])

  function openCreate() {
    setForm(EMPTY_FORM)
    setError(null)
    setCreating(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await api.creerVersementEtablissement(form)
      setCreating(false)
      refresh()
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Échec de l'enregistrement.")
    } finally {
      setSaving(false)
    }
  }

  const totalEnCours = suivi.reduce((s, x) => s + x.credits_en_cours, 0)
  const totalEnRetard = suivi.reduce((s, x) => s + x.credits_en_retard, 0)
  const totalVerse = suivi.reduce((s, x) => s + x.montant_verse, 0)
  const totalEcart = suivi.reduce((s, x) => s + x.ecart, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Suivi crédits Aide Humanitaire</h1>
          <p className="text-sm text-slate-500">Crédits en cours et rapprochement des versements par établissement</p>
        </div>
        {canGerer && (
          <button onClick={openCreate} className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800">
            + Enregistrer un versement
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Crédits en cours" value={formatGNF(totalEnCours)} />
        <StatCard label="Crédits en retard" value={formatGNF(totalEnRetard)} />
        <StatCard label="Versements reçus" value={formatGNF(totalVerse)} />
        <StatCard label="Écart cumulé" value={formatGNF(totalEcart)} />
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Établissement</th>
              <th className="px-4 py-3 text-right">Bénéficiaires</th>
              <th className="px-4 py-3 text-right">En cours</th>
              <th className="px-4 py-3 text-right">En retard</th>
              <th className="px-4 py-3 text-right">Versé</th>
              <th className="px-4 py-3 text-right">Écart</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {suivi.map((s) => (
              <tr key={s.etablissement_id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{s.etablissement_nom}</td>
                <td className="px-4 py-3 text-right text-slate-600">{s.nombre_beneficiaires}</td>
                <td className="px-4 py-3 text-right text-slate-600">{formatGNF(s.credits_en_cours)}</td>
                <td className={`px-4 py-3 text-right font-medium ${s.credits_en_retard > 0 ? 'text-red-600' : 'text-slate-600'}`}>
                  {formatGNF(s.credits_en_retard)}
                </td>
                <td className="px-4 py-3 text-right text-slate-600">{formatGNF(s.montant_verse)}</td>
                <td className={`px-4 py-3 text-right font-medium ${s.ecart > 0 ? 'text-amber-700' : 'text-slate-600'}`}>
                  {formatGNF(s.ecart)}
                </td>
              </tr>
            ))}
            {suivi.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Aucun établissement partenaire.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Versements reçus</h2>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Établissement</th>
                <th className="px-4 py-3 text-right">Montant</th>
                <th className="px-4 py-3">Référence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {versements.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{formatShortDate(v.date)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{v.etablissement_nom}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{formatGNF(v.montant)}</td>
                  <td className="px-4 py-3 text-slate-600">{v.reference ?? '—'}</td>
                </tr>
              ))}
              {versements.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    Aucun versement enregistré.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {creating && (
        <Modal title="Enregistrer un versement établissement" onClose={() => setCreating(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Établissement</label>
              <SearchableSelect
                value={form.etablissement_id}
                onChange={(v) => setForm({ ...form, etablissement_id: v })}
                options={etablissements.map((e) => ({ value: e.id, label: e.nom }))}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Montant (GNF)</label>
              <input
                type="number"
                min={1}
                value={form.montant}
                onChange={(e) => setForm({ ...form, montant: Number(e.target.value) })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Référence (facultatif)</label>
              <input
                value={form.reference ?? ''}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                placeholder="Ex : virement groupé juillet"
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
