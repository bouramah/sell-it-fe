import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { ROLE_LABELS } from '../types'

interface NavItem {
  to: string
  label: string
  end?: boolean
}

interface NavSection {
  title: string
  items: NavItem[]
}

const sections: NavSection[] = [
  { title: 'Pilotage', items: [{ to: '/', label: 'Tableau de bord', end: true }] },
  {
    title: 'Réseau',
    items: [
      { to: '/boutiques', label: 'Boutiques' },
      { to: '/produits', label: 'Produits' },
      { to: '/fournisseurs', label: 'Fournisseurs' },
      { to: '/utilisateurs', label: 'Utilisateurs & droits' },
    ],
  },
  {
    title: 'Clients & paiements',
    items: [
      { to: '/clients', label: 'Clients' },
      { to: '/paiements-clients', label: 'Paiements clients' },
      { to: '/paiements-fournisseurs', label: 'Paiements fournisseurs' },
    ],
  },
  {
    title: 'Opérations',
    items: [
      { to: '/stock', label: 'Stocks' },
      { to: '/caisse', label: 'Caisse' },
      { to: '/commandes-clients', label: 'Commandes clients' },
      { to: '/commandes-fournisseurs', label: 'Commandes fournisseurs' },
      { to: '/livraisons', label: 'Livraisons' },
      { to: '/depenses', label: 'Dépenses' },
      { to: '/dettes', label: 'Dettes & créances' },
      { to: '/transferts', label: 'Transferts de stock' },
    ],
  },
  {
    title: 'Finance & marketing',
    items: [
      { to: '/comptabilite', label: 'Comptabilité' },
      { to: '/promotions', label: 'Promotions & tarifs' },
    ],
  },
  {
    title: 'Intelligence artificielle',
    items: [
      { to: '/catalogue', label: 'Catalogue & recherche' },
      { to: '/chatbot', label: 'Chatbot service client' },
      { to: '/previsions', label: 'Prévisions de demande' },
      { to: '/reporting', label: 'Reporting intelligent' },
    ],
  },
  { title: 'Sécurité', items: [{ to: '/securite', label: 'Sécurité & audit' }] },
  { title: 'Configuration', items: [{ to: '/parametres', label: 'Paramètres' }] },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex">
        <aside className="w-64 shrink-0 border-r border-slate-200 bg-white min-h-screen p-4 overflow-y-auto">
          <div className="mb-6 flex items-center gap-2 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-sm font-bold text-white">
              K
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-slate-900">KFSTORE</div>
              <div className="text-[11px] text-slate-500">GROUPE SKF SARL</div>
            </div>
          </div>
          <nav className="space-y-5">
            {sections.map((section) => (
              <div key={section.title}>
                <div className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {section.title}
                </div>
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `block rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-teal-50 text-teal-800'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
          <div className="mt-6 border-t border-slate-100 pt-4 px-2">
            <div className="text-sm font-semibold text-slate-900">
              {user ? `${user.prenom} ${user.nom}` : '—'}
            </div>
            <div className="text-xs text-slate-500">{user ? ROLE_LABELS[user.role] : ''}</div>
            <button
              onClick={handleLogout}
              className="mt-2 text-xs font-medium text-slate-500 hover:text-red-600"
            >
              Déconnexion
            </button>
          </div>
        </aside>
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
