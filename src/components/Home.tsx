import { Navigate } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import { sections } from '../lib/navSections'
import { usePermissions, usePermissionsLoading } from '../lib/permissions'

/**
 * Route index ("/") : le tableau de bord n'est pas accessible à tous les rôles
 * (cf. matrice des droits, DASHBOARD_BOUTIQUE). On n'affiche donc Dashboard que
 * si le rôle courant y a droit ; sinon on redirige vers la première page du menu
 * que ce rôle peut effectivement utiliser, en réutilisant la même source de
 * vérité que le menu latéral (sections) pour ne jamais diverger de celui-ci.
 */
export default function Home() {
  const permissions = usePermissions()
  const loading = usePermissionsLoading()

  if (loading) return null

  if (permissions.dashboard) return <Dashboard />

  for (const section of sections) {
    for (const item of section.items) {
      if (item.to === '/') continue
      if (!item.visible || item.visible(permissions)) {
        return <Navigate to={item.to} replace />
      }
    }
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
      Votre compte n'a accès à aucune page pour le moment. Contactez un administrateur.
    </div>
  )
}
