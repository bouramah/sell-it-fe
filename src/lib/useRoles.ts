import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { RoleInfo } from '../types'

export function useRoles() {
  const [roles, setRoles] = useState<RoleInfo[]>([])

  const recharger = () => {
    api.roles().then(setRoles)
  }

  useEffect(() => {
    recharger()
  }, [])

  const nomRole = (id: string | null | undefined) =>
    roles.find((r) => r.id === id)?.libelle ?? id ?? '—'

  return { roles, nomRole, recharger }
}
