export function CompanyCardSkeleton() {
  return (
    <article
      className="overflow-hidden rounded-[18px] border border-[#e8e8ed] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
      aria-hidden
    >
      <div className="h-28 animate-pulse bg-[#f0f0f2]" />
      <div className="space-y-3 p-4">
        <div className="flex gap-3">
          <div className="h-14 w-14 shrink-0 animate-pulse rounded-xl bg-[#f0f0f2]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-[#f0f0f2]" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-[#f0f0f2]" />
          </div>
        </div>
        <div className="h-3 w-full animate-pulse rounded bg-[#f0f0f2]" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-[#f0f0f2]" />
        <div className="h-9 w-full animate-pulse rounded-full bg-[#f0f0f2]" />
      </div>
    </article>
  )
}
