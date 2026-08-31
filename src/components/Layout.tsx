import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import ConfirmDialog from './ConfirmDialog'
import { useAuth } from '../lib/AuthContext'
import { sections } from '../lib/navSections'
import { usePermissions } from '../lib/permissions'
import { useRoles } from '../lib/useRoles'

export default function Layout() {
  const { user, logout } = useAuth()
  const permissions = usePermissions()
  const { nomRole } = useRoles()
  const navigate = useNavigate()
  const [confirmLogout, setConfirmLogout] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const initiales = user ? `${user.prenom[0] ?? ''}${user.nom[0] ?? ''}`.toUpperCase() : '—'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex">
        <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white sticky top-0 h-screen shadow-[1px_0_4px_rgba(15,23,42,0.03)]">
          <div className="border-b border-slate-100 px-5 py-5">
            <img src="/logo.jpeg" alt="KFSTORE" className="h-8 w-auto" />
          </div>
          <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
            {sections.map((section) => {
              const items = section.items.filter((item) => !item.visible || item.visible(permissions))
              if (items.length === 0) return null
              return (
                <div key={section.title}>
                  <div className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {section.title}
                  </div>
                  <div className="space-y-0.5">
                    {items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                          `block rounded-lg border-l-[3px] px-3 py-1.5 text-sm font-medium transition-colors ${
                            isActive
                              ? 'border-teal-600 bg-teal-50 pl-[9px] text-teal-800'
                              : 'border-transparent pl-3 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`
                        }
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              )
            })}
          </nav>
          <div className="border-t border-slate-100 p-3">
            <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-800">
                {initiales}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-slate-900">
                  {user ? `${user.prenom} ${user.nom}` : '—'}
                </div>
                <div className="truncate text-xs text-slate-500">{user ? nomRole(user.role) : ''}</div>
              </div>
              <button
                onClick={() => setConfirmLogout(true)}
                title="Déconnexion"
                className="shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path
                    fillRule="evenodd"
                    d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z"
                    clipRule="evenodd"
                  />
                  <path
                    fillRule="evenodd"
                    d="M6 10a.75.75 0 0 1 .75-.75h9.19l-2.72-2.72a.75.75 0 1 1 1.06-1.06l4 4a.75.75 0 0 1 0 1.06l-4 4a.75.75 0 1 1-1.06-1.06l2.72-2.72H6.75A.75.75 0 0 1 6 10Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </aside>
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>

      {confirmLogout && (
        <ConfirmDialog
          title="Déconnexion"
          message="Voulez-vous vraiment vous déconnecter ?"
          confirmLabel="Se déconnecter"
          onConfirm={handleLogout}
          onCancel={() => setConfirmLogout(false)}
        />
      )}
    </div>
  )
}
