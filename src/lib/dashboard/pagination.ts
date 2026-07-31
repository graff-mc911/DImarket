export function paginate<T>(items: T[], page: number, pageSize: number): {
  page: number
  pageSize: number
  total: number
  totalPages: number
  items: T[]
} {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  return {
    page: safePage,
    pageSize,
    total,
    totalPages,
    items: items.slice(start, start + pageSize),
  }
}
