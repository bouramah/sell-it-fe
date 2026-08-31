import { useEffect, useState } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import Spinner from '../components/Spinner'
import { formatDate } from '../lib/format'
import type { CodeSms } from '../types'

const STATUT_LABELS: Record<CodeSms['statut'], string> = { actif: 'Actif', utilise: 'Utilisé', expire: 'Expiré' }
const STATUT_TONE: Record<CodeSms['statut'], 'success' | 'default' | 'warning'> = { actif: 'success', utilise: 'default', expire: 'warning' }

export default function CodesSms() {
  const [codes, setCodes] = useState<CodeSms[]>([])
  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  function refresh() {
    setLoading(true)
    api.codesSms()
      .then((c) => { setCodes(c); setDenied(false) })
      .catch(() => setDenied(true))
      .finally(() => setLoading(false))
  }

  useEffect(refresh, [])

  async function handleCopier(code: string, id: string) {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedId(id)
      setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1500)
    } catch {
      // Presse-papier indisponible (contexte non sécurisé, permission refusée…) — le code
      // reste visible à l'écran, la copie n'est qu'un confort.
    }
  }

  if (denied) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        Les codes SMS de secours sont réservés à l'administrateur.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Codes SMS (secours)</h1>
        <p className="text-sm text-slate-500">
          Codes et mots de passe envoyés par SMS ces 7 derniers jours — en clair, pour les communiquer vous-même si
          le SMS n'est jamais arrivé (panne du fournisseur, numéro erroné…).
        </p>
      </div>

      {loading ? (
        <Spinner size="lg" className="py-16" label="Chargement…" />
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Généré le</th>
                <th className="px-4 py-3">Expire le</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {codes.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">{c.objectif_libelle}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{c.contact}</td>
                  <td className="px-4 py-3">
                    {c.code_clair ? (
                      <span className="flex items-center gap-2">
                        <code className="rounded bg-slate-100 px-2 py-1 font-mono text-sm text-slate-800">{c.code_clair}</code>
                        <button
                          onClick={() => handleCopier(c.code_clair as string, c.id)}
                          className="text-xs font-medium text-teal-700 hover:underline"
                        >
                          {copiedId === c.id ? 'Copié' : 'Copier'}
                        </button>
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(c.created_at)}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {c.objectif === 'mot_de_passe_admin' ? '—' : formatDate(c.expires_at)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUT_TONE[c.statut]}>{STATUT_LABELS[c.statut]}</Badge>
                  </td>
                </tr>
              ))}
              {codes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Aucun code envoyé ces 7 derniers jours.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
