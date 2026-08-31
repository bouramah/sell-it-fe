import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import Modal from '../components/Modal'
import SearchableSelect from '../components/SearchableSelect'
import { SpinnerBloc } from '../components/Spinner'
import StatCard from '../components/StatCard'
import { formatGNF, formatShortDate } from '../lib/format'
import { usePermissions } from '../lib/permissions'
import type { Etablissement, LigneDette, SuiviEtablissement, VersementEtablissement } from '../types'
import type { VersementEtablissementInput } from '../types/write'

const EMPTY_FORM: VersementEtablissementInput = { etablissement_id: '', montant: 0, date: new Date().toISOString().slice(0, 10), reference: '', dette_ids: [] }

export default function AideHumanitaireDashboard() {
  const [suivi, setSuivi] = useState<SuiviEtablissement[]>([])
  const [versements, setVersements] = useState<VersementEtablissement[]>([])
  const [etablissements, setEtablissements] = useState<Etablissement[]>([])
  const [loading, setLoading] = useState(true)
  const { beneficiaireGestion: canGerer } = usePermissions()

  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<VersementEtablissementInput>(EMPTY_FORM)
  const [dettesEtablissement, setDettesEtablissement] = useState<LigneDette[]>([])
  const [loadingDettes, setLoadingDettes] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function refresh() {
    setLoading(true)
    Promise.all([
      api.suiviAideHumanitaire().then(setSuivi),
      api.versementsEtablissements().then(setVersements),
      api.etablissements().then(setEtablissements),
    ]).finally(() => setLoading(false))
  }

  useEffect(refresh, [])

  useEffect(() => {
    if (!form.etablissement_id) {
      setDettesEtablissement([])
      return
    }
    setLoadingDettes(true)
    api.dettesEnCoursEtablissement(form.etablissement_id)
      .then(setDettesEtablissement)
      .finally(() => setLoadingDettes(false))
  }, [form.etablissement_id])

  function openCreate() {
    setForm(EMPTY_FORM)
    setError(null)
    setCreating(true)
  }

  function toggleDette(detteId: string) {
    const ids = form.dette_ids ?? []
    setForm({ ...form, dette_ids: ids.includes(detteId) ? ids.filter((id) => id !== detteId) : [...ids, detteId] })
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
        <StatCard label="Solde dû cumulé" value={formatGNF(totalEcart)} />
      </div>

      {loading && suivi.length === 0 ? (
        <SpinnerBloc />
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Établissement</th>
                <th className="px-4 py-3 text-right">Bénéficiaires</th>
                <th className="px-4 py-3 text-right">En cours</th>
                <th className="px-4 py-3 text-right">En retard</th>
                <th className="px-4 py-3 text-right">Versé</th>
                <th className="px-4 py-3 text-right">Solde dû</th>
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
                  <td className="px-4 py-3 text-right font-medium text-slate-900">{formatGNF(s.ecart)}</td>
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
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Versements reçus</h2>
        {loading && versements.length === 0 ? (
          <SpinnerBloc />
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Établissement</th>
                  <th className="px-4 py-3 text-right">Montant</th>
                  <th className="px-4 py-3">Référence</th>
                  <th className="px-4 py-3">Bénéficiaires réglés</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {versements.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500">{formatShortDate(v.date)}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{v.etablissement_nom}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatGNF(v.montant)}</td>
                    <td className="px-4 py-3 text-slate-600">{v.reference || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {v.beneficiaires_regles.length > 0 ? v.beneficiaires_regles.join(', ') : <span className="text-slate-400">Non détaillé</span>}
                    </td>
                  </tr>
                ))}
                {versements.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                      Aucun versement enregistré.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
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
            {form.etablissement_id && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Bénéficiaires réglés par ce versement (facultatif)
                </label>
                <p className="mb-2 text-xs text-slate-400">
                  Cochez les créances que ce versement couvre — sans cela, on saura seulement qu'un établissement a payé, pas pour qui.
                </p>
                <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-slate-200 p-2">
                  {loadingDettes && <p className="text-xs text-slate-400">Chargement…</p>}
                  {!loadingDettes && dettesEtablissement.length === 0 && (
                    <p className="text-xs text-slate-400">Aucune créance en cours pour cet établissement.</p>
                  )}
                  {dettesEtablissement.map((d) => (
                    <label key={d.id} className="flex items-center justify-between gap-2 rounded px-1 py-1 text-sm hover:bg-slate-50">
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={(form.dette_ids ?? []).includes(d.id)}
                          onChange={() => toggleDette(d.id)}
                        />
                        {d.tiers_nom}
                      </span>
                      <span className="text-slate-500">{formatGNF(d.solde_restant)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
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
