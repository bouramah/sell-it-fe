interface PaginationProps {
  page: number
  pageCount: number
  onChange: (page: number) => void
  totalItems: number
  pageSize: number
}

export default function Pagination({ page, pageCount, onChange, totalItems, pageSize }: PaginationProps) {
  if (pageCount <= 1) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)

  return (
    <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 text-sm">
      <span className="text-slate-500">
        {start}–{end} sur {totalItems}
      </span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="rounded-md border border-slate-300 px-3 py-1 text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:hover:border-slate-300 disabled:hover:bg-transparent"
        >
          Précédent
        </button>
        <span className="text-slate-500">
          Page {page} / {pageCount}
        </span>
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page === pageCount}
          className="rounded-md border border-slate-300 px-3 py-1 text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:hover:border-slate-300 disabled:hover:bg-transparent"
        >
          Suivant
        </button>
      </div>
    </div>
  )
}
