/** Lightweight route fallback while lazy page chunks load. */
export function PageLoading() {
  return (
    <div
      className="layout-page-content flex min-h-[40vh] items-center justify-center py-16"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-[#e8ddd4] border-t-[#c45c3e]"
          aria-hidden
        />
        <p className="text-sm text-[#6f665d]">Loading…</p>
      </div>
    </div>
  )
}
