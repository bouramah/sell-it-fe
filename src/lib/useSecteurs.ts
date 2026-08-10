import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { ReferentielItem } from '../types'

export function useSecteurs() {
  const [secteurs, setSecteurs] = useState<ReferentielItem[]>([])

  useEffect(() => {
    api.referentiels().then((r) => setSecteurs(r.secteurs ?? []))
  }, [])

  const nomSecteur = (id: string | null | undefined) =>
    secteurs.find((s) => s.id === id)?.nom ?? id ?? '—'

  return { secteurs, nomSecteur }
}
