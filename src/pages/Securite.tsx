import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import Pagination from '../components/Pagination'
import SearchInput from '../components/SearchInput'
import { formatDate } from '../lib/format'
import { useBoutiques } from '../lib/useBoutiques'
import { usePagination } from '../lib/usePagination'
import { useSearch } from '../lib/useSearch'
import type { JournalAuditEntry, ParametreApplication, ParametreSecurite } from '../types'

export default function Securite() {
  const [audit, setAudit] = useState<JournalAuditEntry[]>([])
  const [parametres, setParametres] = useState<ParametreSecurite[]>([])
  const [parametresApp, setParametresApp] = useState<ParametreApplication[]>([])
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [denied, setDenied] = useState(false)
  const { nomBoutique } = useBoutiques()

  function refresh() {
    api.audit().then(setAudit).catch(() => setDenied(true))
    api.parametresSecurite().then(setParametres).catch(() => setDenied(true))
    api.parametresApplication().then(setParametresApp).catch(() => {})
  }

  useEffect(refresh, [])

  if (denied) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        Le journal d'audit et les paramètres de sécurité sont réservés à l'administrateur.
      </div>
    )
  }

  async function handleToggle(p: ParametreSecurite) {
    setTogglingId(p.id)
    try {
      await api.modifierParametreSecurite(p.id, !p.actif)
      refresh()
    } finally {
      setTogglingId(null)
    }
  }

  async function handleToggleApp(p: ParametreApplication) {
    setTogglingId(p.id)
    try {
      await api.modifierParametreApplication(p.id, !p.actif)
      refresh()
    } finally {
      setTogglingId(null)
    }
  }

  const getFields = useCallback(
    (a: JournalAuditEntry) => [a.action, a.auteur, a.boutique_id ? nomBoutique(a.boutique_id) : 'Siège'],
    [nomBoutique]
  )
  const { query, setQuery, filtered } = useSearch(audit, getFields)
  const { page, setPage, pageCount, paginated, totalItems, pageSize } = usePagination(filtered)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sécurité & audit</h1>
        <p className="text-sm text-slate-500">Journal d'audit et paramètres de sécurité</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Journal d'audit</h2>
          <p className="mb-4 text-xs text-slate-400">
            Écriture seule — aucune suppression ni modification a posteriori possible, y compris par un administrateur.
          </p>
          <div className="mb-3">
            <SearchInput value={query} onChange={setQuery} placeholder="Rechercher dans le journal…" />
          </div>
          <ul className="space-y-3">
            {paginated.map((a) => (
              <li key={a.id} className="border-l-2 border-slate-200 pl-3">
                <div className="text-xs text-slate-400">{formatDate(a.horodatage)}</div>
                <div className="text-sm font-medium text-slate-900">{a.action}</div>
                <div className="text-xs text-slate-500">
                  {a.auteur} · {a.boutique_id ? nomBoutique(a.boutique_id) : 'Siège'}
                </div>
              </li>
            ))}
          </ul>
          <Pagination page={page} pageCount={pageCount} onChange={setPage} totalItems={totalItems} pageSize={pageSize} />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">Paramètres de sécurité</h2>
          <ul className="space-y-3">
            {parametres.map((p) => (
              <li key={p.id} className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm">
                <span className="text-slate-700">{p.label}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={p.actif}
                  disabled={togglingId === p.id}
                  onClick={() => handleToggle(p)}
                  className={`inline-block h-5 w-9 rounded-full transition-colors disabled:opacity-50 ${p.actif ? 'bg-teal-700' : 'bg-slate-300'}`}
                >
                  <span
                    className={`block h-4 w-4 translate-y-0.5 rounded-full bg-white transition-transform ${
                      p.actif ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-600">Paramètres application</h2>
          <p className="mb-4 text-xs text-slate-400">
            Fonctionnalités globales de l'appli mobile interne.
          </p>
          <ul className="space-y-3">
            {parametresApp.map((p) => (
              <li key={p.id} className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm">
                <span className="text-slate-700">{p.label}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={p.actif}
                  disabled={togglingId === p.id}
                  onClick={() => handleToggleApp(p)}
                  className={`inline-block h-5 w-9 rounded-full transition-colors disabled:opacity-50 ${p.actif ? 'bg-teal-700' : 'bg-slate-300'}`}
                >
                  <span
                    className={`block h-4 w-4 translate-y-0.5 rounded-full bg-white transition-transform ${
                      p.actif ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
