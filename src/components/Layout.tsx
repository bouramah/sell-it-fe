import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/boutiques', label: 'Boutiques' },
  { to: '/stock', label: 'Stock' },
  { to: '/utilisateurs', label: 'Utilisateurs & droits' },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex">
        <aside className="w-64 shrink-0 border-r border-slate-200 bg-white min-h-screen p-4">
          <div className="mb-8 px-2">
            <div className="text-lg font-bold tracking-tight text-blue-900">KFSTORE</div>
            <div className="text-xs text-slate-500">GROUPE SKF SARL — Back-office</div>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
