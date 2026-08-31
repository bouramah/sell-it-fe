import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/client'
import Spinner from '../components/Spinner'
import { formatGNF } from '../lib/format'
import type { ValidationGarantDetail } from '../types'

const GARANT_LABELS: Record<string, string> = { referent: 'Garant référent', comptabilite: 'Garant comptabilité' }
const STATUT_LABELS: Record<string, string> = { en_attente: 'En attente', validee: 'Validée', refusee: 'Refusée' }

export default function ValidationGarant() {
  const { token } = useParams<{ token: string }>()
  const [detail, setDetail] = useState<ValidationGarantDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refusant, setRefusant] = useState(false)
  const [motifRefus, setMotifRefus] = useState('')
  const [saving, setSaving] = useState(false)

  function charger() {
    if (!token) return
    setLoading(true)
    api.consulterValidationGarant(token)
      .then((d) => { setDetail(d); setError(null) })
      .catch((e) => setError(e instanceof Error && e.message ? e.message : 'Lien invalide ou expiré.'))
      .finally(() => setLoading(false))
  }

  useEffect(charger, [token])

  async function envoyerDecision(approuve: boolean, motif?: string) {
    if (!token) return
    setSaving(true)
    setError(null)
    try {
      const d = await api.repondreValidationGarant(token, { approuve, motif_refus: motif })
      setDetail(d)
      setRefusant(false)
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Échec de l'envoi de votre réponse.")
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmitRefus(e: FormEvent) {
    e.preventDefault()
    if (!motifRefus.trim()) return
    await envoyerDecision(false, motifRefus.trim())
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 text-center">
          <h1 className="text-lg font-bold text-slate-900">KFSTORE — Aide Humanitaire</h1>
          <p className="text-sm text-slate-500">Validation d'une demande de crédit alimentaire</p>
        </div>

        {loading && <Spinner size="lg" className="py-4" label="Chargement…" />}

        {!loading && error && !detail && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}

        {detail && (
          <div className="space-y-4">
            <div className="rounded-md border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{GARANT_LABELS[detail.type_garant] ?? detail.type_garant}</p>
              <p className="mt-2 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{detail.beneficiaire_nom}</span> ({detail.etablissement_nom}, {detail.poste})
                sollicite un crédit alimentaire de <span className="font-semibold text-slate-900">{formatGNF(detail.montant_souhaite)}</span>.
              </p>
              <p className="mt-2 text-sm text-slate-600">Motif : {detail.motif}</p>
              {detail.salaire_reference !== null && (
                <p className="mt-2 text-sm text-slate-600">Salaire de référence : {formatGNF(detail.salaire_reference)}</p>
              )}
              <p className="mt-3 text-xs text-slate-400">
                Autre garant : {STATUT_LABELS[detail.autre_garant_statut] ?? detail.autre_garant_statut}
              </p>
            </div>

            {detail.statut !== 'en_attente' ? (
              <p className={`rounded-md p-3 text-sm font-medium ${detail.statut === 'validee' ? 'bg-teal-50 text-teal-800' : 'bg-red-50 text-red-700'}`}>
                {detail.statut === 'validee'
                  ? 'Vous avez validé cette demande. Merci.'
                  : 'Vous avez refusé cette demande.'}
              </p>
            ) : !refusant ? (
              <div className="flex gap-3">
                <button
                  onClick={() => setRefusant(true)}
                  disabled={saving}
                  className="flex-1 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Refuser
                </button>
                <button
                  onClick={() => envoyerDecision(true)}
                  disabled={saving}
                  className="flex-1 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
                >
                  {saving ? 'Envoi…' : 'Valider'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitRefus} className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">Motif du refus</label>
                <input
                  value={motifRefus}
                  onChange={(e) => setMotifRefus(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  autoFocus
                  required
                />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setRefusant(false)} className="flex-1 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    Annuler
                  </button>
                  <button type="submit" disabled={saving} className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60">
                    {saving ? 'Envoi…' : 'Confirmer le refus'}
                  </button>
                </div>
              </form>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
