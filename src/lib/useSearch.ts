import { useMemo, useState } from 'react'

export function useSearch<T>(items: T[], getFields: (item: T) => (string | null | undefined)[]) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => getFields(item).some((f) => f?.toLowerCase().includes(q)))
  }, [items, query, getFields])

  return { query, setQuery, filtered }
}
