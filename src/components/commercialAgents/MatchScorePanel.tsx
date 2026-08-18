import type { TranslateFn } from '../../lib/i18n'
import type { MatchResult } from '../../lib/commercialAgents/types'

export function MatchScorePanel({
  match,
  t,
  compact = false,
}: {
  match: MatchResult
  t: TranslateFn
  compact?: boolean
}) {
  const labelKey =
    match.label === 'excellent'
      ? 'commercialAgents.matchExcellent'
      : match.label === 'good'
        ? 'commercialAgents.matchGood'
        : 'commercialAgents.matchPotential'

  const tone =
    match.score >= 85
      ? 'bg-[#248a3d] text-white'
      : match.score >= 65
        ? 'bg-[#ff9900] text-[#0f1111]'
        : 'bg-[#e7e9ec] text-[#0f1111]'

  if (compact) {
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${tone}`}>
        {match.score}% · {t(labelKey)}
      </span>
    )
  }

  const rows: Array<[string, number]> = [
    [t('commercialAgents.matchCountry'), match.breakdown.country],
    [t('commercialAgents.matchIndustry'), match.breakdown.industry],
    [t('commercialAgents.matchCategory'), match.breakdown.category],
    [t('commercialAgents.matchExperience'), match.breakdown.experience],
    [t('commercialAgents.matchLanguage'), match.breakdown.language],
  ]

  return (
    <div className="rounded-2xl border border-[var(--line-200)] bg-white/90 p-4 shadow-[0_8px_24px_rgba(15,17,17,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-500)]">
            {t('commercialAgents.matchScore')}
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--ink-800)]">{t(labelKey)}</p>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-lg font-extrabold tabular-nums ${tone}`}>
          {match.score}%
        </span>
      </div>
      <ul className="mt-4 space-y-2">
        {rows.map(([label, value]) => (
          <li key={label} className="flex items-center justify-between text-sm text-[var(--ink-700)]">
            <span>{label}</span>
            <span className="font-semibold tabular-nums">{value}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
