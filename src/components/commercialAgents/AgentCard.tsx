import { MapPin } from 'lucide-react'
import { navigateTo } from '../../lib/navigation'
import { normalizeSpokenLanguageList } from '../../lib/languageDisplay'
import type { TranslateFn } from '../../lib/i18n'
import type { AgentProfile } from '../../lib/commercialAgents/types'
import { VerifiedB2BBadge } from './VerifiedB2BBadge'

export function AgentCard({
  item,
  t,
  matchScore,
}: {
  item: AgentProfile
  t: TranslateFn
  matchScore?: number
}) {
  return (
    <button
      type="button"
      onClick={() => navigateTo(`/commercial-agents/representatives/${item.slug}`)}
      className="group flex w-full flex-col rounded-none border border-[var(--line-200)] bg-white/95 p-5 text-left shadow-[0_10px_30px_rgba(15,17,17,0.04)] transition hover:border-[rgba(255,153,0,0.45)] hover:shadow-[0_16px_40px_rgba(15,17,17,0.08)]"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#232f3e] text-lg font-bold text-white">
          {item.profile_photo_url ? (
            <img src={item.profile_photo_url} alt="" className="h-full w-full object-cover" />
          ) : (
            item.full_name.slice(0, 1).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-bold text-[var(--ink-900)] group-hover:text-[#c45500]">
              {item.full_name}
            </h3>
            <VerifiedB2BBadge status={item.verification_status} kind="agent" t={t} />
          </div>
          {item.company_name ? (
            <p className="mt-0.5 text-sm text-[var(--ink-600)]">{item.company_name}</p>
          ) : null}
          {(item.country || item.city) && (
            <p className="mt-1 inline-flex items-center gap-1 text-sm text-[var(--ink-600)]">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {[item.city, item.country].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
        {typeof matchScore === 'number' ? (
          <span className="rounded-full bg-[#248a3d] px-2 py-0.5 text-xs font-bold text-white">
            {matchScore}%
          </span>
        ) : null}
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--ink-600)]">
        {item.description || t('commercialAgents.noDescription')}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {item.years_experience != null ? (
          <span className="rounded-full bg-[#f3f4f6] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--ink-700)]">
            {item.years_experience}+ {t('commercialAgents.yearsExp')}
          </span>
        ) : null}
        {item.available_for_new_brands ? (
          <span className="rounded-full bg-[rgba(36,138,61,0.12)] px-2.5 py-0.5 text-[11px] font-semibold text-[#248a3d]">
            {t('commercialAgents.availableForBrands')}
          </span>
        ) : null}
        {normalizeSpokenLanguageList(item.languages).slice(0, 2).map((l) => (
          <span
            key={l}
            className="rounded-full bg-[#f3f4f6] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--ink-700)]"
          >
            {l}
          </span>
        ))}
      </div>
    </button>
  )
}
