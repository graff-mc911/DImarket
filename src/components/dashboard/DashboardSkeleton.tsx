export function DashboardSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: cards }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-[22px] border border-[#e8e8ed] bg-white"
          />
        ))}
      </div>
      <div className="h-56 animate-pulse rounded-[22px] border border-[#e8e8ed] bg-white" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-[22px] border border-[#e8e8ed] bg-white" />
        <div className="h-64 animate-pulse rounded-[22px] border border-[#e8e8ed] bg-white" />
      </div>
    </div>
  )
}
