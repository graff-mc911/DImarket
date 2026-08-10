import { MapPin } from 'lucide-react'
import { navigateTo } from '../../lib/navigation'
import type { RepresentationOpportunity } from '../../lib/commercialAgents/types'

export function OpportunityCard({
  item,
  t,
  matchScore,
}: {
  item: RepresentationOpportunity
  t: (key: string) => string
  matchScore?: number
}) {
  const mfr = item.manufacturer
  return (
    <button
      type="button"
      onClick={() => navigateTo(`/commercial-agents/opportunities/${item.id}`)}
      className="group flex w-full flex-col rounded-2xl border border-[var(--line-200)] bg-white/95 p-5 text-left shadow-[0_10px_30px_rgba(15,17,17,0.04)] transition hover:border-[rgba(255,153,0,0.45)] hover:shadow-[0_16px_40px_rgba(15,17,17,0.08)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-500)]">
            {mfr?.company_name ?? t('commercialAgents.manufacturer')}
          </p>
          <h3 className="mt-1 text-base font-bold text-[var(--ink-900)] group-hover:text-[#c45500]">
            {item.title}
          </h3>
        </div>
        {typeof matchScore === 'number' ? (
          <span className="rounded-full bg-[#248a3d] px-2 py-0.5 text-xs font-bold text-white">
            {matchScore}%
          </span>
        ) : null}
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--ink-600)]">{item.description}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {item.target_country ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#f3f4f6] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--ink-700)]">
            <MapPin className="h-3 w-3" aria-hidden />
            {item.target_country}
          </span>
        ) : null}
        {item.exclusive ? (
          <span className="rounded-full bg-[rgba(255,153,0,0.15)] px-2.5 py-0.5 text-[11px] font-semibold text-[#c45500]">
            {t('commercialAgents.exclusive')}
          </span>
        ) : (
          <span className="rounded-full bg-[#f3f4f6] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--ink-700)]">
            {t('commercialAgents.nonExclusive')}
          </span>
        )}
        {item.commission_range ? (
          <span className="rounded-full bg-[#f3f4f6] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--ink-700)]">
            {t('commercialAgents.commission')}: {item.commission_range}
          </span>
        ) : null}
      </div>
    </button>
  )
}
