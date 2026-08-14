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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex">
        <aside className="w-64 shrink-0 border-r border-slate-200 bg-white sticky top-0 h-screen overflow-y-auto p-4">
          <div className="mb-6 px-2">
            <img src="/logo.jpeg" alt="KFSTORE" className="h-8 w-auto" />
          </div>
          <nav className="space-y-5">
            {sections.map((section) => {
              const items = section.items.filter((item) => !item.visible || item.visible(permissions))
              if (items.length === 0) return null
              return (
                <div key={section.title}>
                  <div className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {section.title}
                  </div>
                  <div className="space-y-0.5">
                    {items.map((item) => (
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
              )
            })}
          </nav>
          <div className="mt-6 border-t border-slate-100 pt-4 px-2">
            <div className="text-sm font-semibold text-slate-900">
              {user ? `${user.prenom} ${user.nom}` : '—'}
            </div>
            <div className="text-xs text-slate-500">{user ? nomRole(user.role) : ''}</div>
            <button
              onClick={() => setConfirmLogout(true)}
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
