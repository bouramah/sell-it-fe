import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Boutique } from '../types'

export function useBoutiques() {
  const [boutiques, setBoutiques] = useState<Boutique[]>([])

  useEffect(() => {
    api.boutiques().then(setBoutiques)
  }, [])

  const nomBoutique = (id: string | null | undefined) =>
    boutiques.find((b) => b.id === id)?.nom ?? id ?? '—'

  return { boutiques, nomBoutique }
}
