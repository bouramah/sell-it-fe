import { useEffect, useState } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import Pagination from '../components/Pagination'
import SearchInput from '../components/SearchInput'
import SearchableSelect from '../components/SearchableSelect'
import { SpinnerBloc } from '../components/Spinner'
import { formatDate } from '../lib/format'
import { useBoutiques } from '../lib/useBoutiques'
import type { JournalAuditEntry, ParametreApplication, ParametreSecurite, Utilisateur } from '../types'

const TAILLE = 25

const CANAL_LABELS: Record<string, string> = {
  web: 'Back-office web',
  mobile_interne: 'Appli mobile interne',
  mobile_client: 'Appli mobile client',
  inconnu: 'Inconnu / non authentifié',
}

const METHODE_TONE: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  GET: 'default',
  POST: 'success',
  PUT: 'warning',
  PATCH: 'warning',
  DELETE: 'danger',
}

function statutTone(code: number | null): 'default' | 'success' | 'warning' | 'danger' {
  if (code === null) return 'default'
  if (code < 300) return 'success'
  if (code < 400) return 'warning'
  return 'danger'
}

export default function Securite() {
  const [audit, setAudit] = useState<JournalAuditEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const [q, setQ] = useState('')
  const [qDebounced, setQDebounced] = useState('')
  const [utilisateurId, setUtilisateurId] = useState('')
  const [canal, setCanal] = useState('')
  const [methode, setMethode] = useState('')
  const [boutiqueId, setBoutiqueId] = useState('')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')

  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([])
  const [parametres, setParametres] = useState<ParametreSecurite[]>([])
  const [parametresApp, setParametresApp] = useState<ParametreApplication[]>([])
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [denied, setDenied] = useState(false)
  const { boutiques, nomBoutique } = useBoutiques()

  // Debounce : évite un appel serveur à chaque frappe dans la recherche.
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), 300)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    setPage(1)
  }, [qDebounced, utilisateurId, canal, methode, boutiqueId, dateDebut, dateFin])

  useEffect(() => {
    setLoading(true)
    api
      .audit({
        page,
        taille: TAILLE,
        q: qDebounced || undefined,
        utilisateur_id: utilisateurId || undefined,
        canal: canal || undefined,
        methode: methode || undefined,
        boutique_id: boutiqueId || undefined,
        date_debut: dateDebut ? `${dateDebut}T00:00:00` : undefined,
        date_fin: dateFin ? `${dateFin}T23:59:59` : undefined,
      })
      .then((res) => {
        setAudit(res.items)
        setTotal(res.total)
      })
      .catch(() => setDenied(true))
      .finally(() => setLoading(false))
  }, [page, qDebounced, utilisateurId, canal, methode, boutiqueId, dateDebut, dateFin])

  function refreshParametres() {
    api.parametresSecurite().then(setParametres).catch(() => setDenied(true))
    api.parametresApplication().then(setParametresApp).catch(() => {})
    api.utilisateurs().then(setUtilisateurs).catch(() => {})
  }

  useEffect(refreshParametres, [])

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
      refreshParametres()
    } finally {
      setTogglingId(null)
    }
  }

  async function handleToggleApp(p: ParametreApplication) {
    setTogglingId(p.id)
    try {
      await api.modifierParametreApplication(p.id, !p.actif)
      refreshParametres()
    } finally {
      setTogglingId(null)
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / TAILLE))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sécurité & audit</h1>
        <p className="text-sm text-slate-500">Journal d'audit et paramètres de sécurité</p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Journal d'audit</h2>
        <p className="mb-4 text-xs text-slate-400">
          Toute action sur le back-office web et les applis mobiles (interne et client) est tracée automatiquement, y
          compris les consultations — écriture seule, aucune suppression ni modification a posteriori possible.
        </p>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SearchInput value={q} onChange={setQ} placeholder="Rechercher (action, auteur, chemin)…" />
          <SearchableSelect
            value={utilisateurId}
            onChange={setUtilisateurId}
            options={utilisateurs.map((u) => ({ value: u.id, label: `${u.prenom} ${u.nom}` }))}
            allowEmpty="Tous les utilisateurs"
            placeholder="Tous les utilisateurs"
          />
          <SearchableSelect
            value={canal}
            onChange={setCanal}
            options={Object.entries(CANAL_LABELS).map(([value, label]) => ({ value, label }))}
            allowEmpty="Tous les canaux"
            placeholder="Tous les canaux"
          />
          <SearchableSelect
            value={boutiqueId}
            onChange={setBoutiqueId}
            options={boutiques.map((b) => ({ value: b.id, label: b.nom }))}
            allowEmpty="Toutes les boutiques"
            placeholder="Toutes les boutiques"
          />
        </div>
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SearchableSelect
            value={methode}
            onChange={setMethode}
            options={['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => ({ value: m, label: m }))}
            allowEmpty="Toutes les méthodes"
            placeholder="Toutes les méthodes"
          />
          <label className="flex items-center gap-2 text-sm text-slate-500">
            Depuis
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-500">
            Jusqu'au
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
        </div>

        {loading && audit.length === 0 ? (
          <SpinnerBloc />
        ) : (
        <>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Horodatage</th>
                <th className="px-4 py-3">Utilisateur</th>
                <th className="px-4 py-3">Canal</th>
                <th className="px-4 py-3">Méthode</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Boutique</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {audit.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(a.horodatage)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{a.auteur}</td>
                  <td className="px-4 py-3 text-slate-500">{a.canal ? (CANAL_LABELS[a.canal] ?? a.canal) : '—'}</td>
                  <td className="px-4 py-3">{a.methode ? <Badge tone={METHODE_TONE[a.methode] ?? 'default'}>{a.methode}</Badge> : '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{a.action}</td>
                  <td className="px-4 py-3 text-slate-500">{a.boutique_id ? nomBoutique(a.boutique_id) : 'Siège'}</td>
                  <td className="px-4 py-3">{a.statut_code !== null ? <Badge tone={statutTone(a.statut_code)}>{a.statut_code}</Badge> : '—'}</td>
                </tr>
              ))}
              {!loading && audit.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Aucune entrée pour ces filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageCount={pageCount} onChange={setPage} totalItems={total} pageSize={TAILLE} />
        </>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
