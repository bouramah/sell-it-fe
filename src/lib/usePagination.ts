import { useEffect, useState } from 'react'

export const DEFAULT_PAGE_SIZE = 20

export function usePagination<T>(items: T[], pageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))

  useEffect(() => {
    if (page > pageCount) setPage(1)
  }, [pageCount, page])

  const paginated = items.slice((page - 1) * pageSize, page * pageSize)

  return { page, setPage, pageCount, paginated, totalItems: items.length, pageSize }
}
