import { MapPin } from 'lucide-react'
import { navigateTo } from '../../lib/navigation'
import { labelForMatchCategory } from '../../lib/commercialAgents/categories'
import type { TranslateFn } from '../../lib/i18n'
import type { ManufacturerProfile } from '../../lib/commercialAgents/types'
import { VerifiedB2BBadge } from './VerifiedB2BBadge'
import { useApp } from '../../contexts/AppContext'

export function ManufacturerCard({
  item,
  t,
  matchScore,
}: {
  item: ManufacturerProfile
  t: TranslateFn
  matchScore?: number
}) {
  const { language } = useApp()
  return (
    <button
      type="button"
      onClick={() => navigateTo(`/commercial-agents/manufacturers/${item.slug}`)}
      className="group flex w-full flex-col rounded-2xl border border-[var(--line-200)] bg-white p-5 text-left shadow-[0_10px_30px_rgba(15,17,17,0.04)] transition hover:border-[rgba(255,153,0,0.45)] hover:shadow-[0_16px_40px_rgba(15,17,17,0.08)]"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#232f3e] text-lg font-bold text-white">
          {item.logo_url ? (
            <img src={item.logo_url} alt="" className="h-full w-full object-cover" />
          ) : (
            item.company_name.slice(0, 1).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-bold text-[var(--ink-900)] group-hover:text-[#c45500]">
              {item.company_name}
            </h3>
            <VerifiedB2BBadge status={item.verification_status} kind="manufacturer" t={t} />
          </div>
          {item.country ? (
            <p className="mt-1 inline-flex items-center gap-1 text-sm text-[var(--ink-600)]">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {item.country}
              {item.headquarters ? ` · ${item.headquarters}` : ''}
            </p>
          ) : null}
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
      <div className="mt-4 flex flex-wrap gap-1.5">
        {item.categories.slice(0, 3).map((c) => (
          <span
            key={c}
            className="rounded-full bg-[#f3f4f6] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--ink-700)]"
          >
            {labelForMatchCategory(c, language.code)}
          </span>
        ))}
        {item.agent_required ? (
          <span className="rounded-full bg-[rgba(255,153,0,0.15)] px-2.5 py-0.5 text-[11px] font-semibold text-[#c45500]">
            {t('commercialAgents.seekingAgents')}
          </span>
        ) : null}
      </div>
    </button>
  )
}
