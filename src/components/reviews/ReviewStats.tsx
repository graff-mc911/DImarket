import { Star } from 'lucide-react'
import type { RatingStats } from '../../lib/reviews/reviews'

type Props = {
  stats: RatingStats
}

export function ReviewStats({ stats }: Props) {
  if (!stats.count) {
    return (
      <div className="rounded-[18px] border border-[rgba(148,163,184,0.22)] bg-[#fafafa] px-4 py-6 text-center">
        <p className="text-[14px] font-semibold text-[#2f2a24]">No reviews yet</p>
        <p className="mt-1 text-[13px] text-[#8a8178]">Be the first to leave feedback.</p>
      </div>
    )
  }

  const maxBar = Math.max(1, ...Object.values(stats.distribution))

  return (
    <div className="rounded-[20px] border border-[rgba(148,163,184,0.22)] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-5">
      <div className="flex flex-wrap items-end gap-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a8178]">
            Average score
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[40px] font-semibold leading-none tracking-tight text-[#2f2a24]">
              {stats.average.toFixed(1)}
            </span>
            <span className="text-[14px] text-[#8a8178]">/ 5</span>
          </div>
          <div className="mt-2 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.round(stats.average)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-[rgba(148,163,184,0.35)]'
                }`}
              />
            ))}
          </div>
          <p className="mt-2 text-[13px] text-[#6f665d]">
            {stats.count} review{stats.count === 1 ? '' : 's'}
            {stats.recommendPct != null ? ` · ${stats.recommendPct}% recommend` : ''}
          </p>
        </div>

        <div className="min-w-[180px] flex-1 space-y-1.5">
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const n = stats.distribution[star]
            const pct = Math.round((n / maxBar) * 100)
            return (
              <div key={star} className="flex items-center gap-2 text-[12px]">
                <span className="w-3 font-semibold text-[#2f2a24]">{star}</span>
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#f0f0f2]">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-6 text-right text-[#8a8178]">{n}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
