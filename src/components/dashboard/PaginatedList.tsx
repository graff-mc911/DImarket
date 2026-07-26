import { useMemo, useState, type ReactNode } from 'react'
import { paginate } from '../../lib/dashboard/pagination'

type PaginatedListProps<T> = {
  items: T[]
  pageSize?: number
  empty: ReactNode
  renderItem: (item: T, index: number) => ReactNode
  className?: string
  getKey: (item: T, index: number) => string
}

export function PaginatedList<T>({
  items,
  pageSize = 8,
  empty,
  renderItem,
  className,
  getKey,
}: PaginatedListProps<T>) {
  const [page, setPage] = useState(1)
  const slice = useMemo(() => paginate(items, page, pageSize), [items, page, pageSize])

  if (!items.length) return <>{empty}</>

  return (
    <div className={className}>
      <ul className="space-y-2">
        {slice.items.map((item, i) => (
          <li key={getKey(item, i)}>{renderItem(item, i)}</li>
        ))}
      </ul>
      {slice.totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between gap-2 text-[13px]">
          <button
            type="button"
            disabled={slice.page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-full border border-[#e8e8ed] px-3 py-1.5 font-semibold disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-[#86868b]">
            Page {slice.page} / {slice.totalPages}
          </span>
          <button
            type="button"
            disabled={slice.page >= slice.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-full border border-[#e8e8ed] px-3 py-1.5 font-semibold disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  )
}
