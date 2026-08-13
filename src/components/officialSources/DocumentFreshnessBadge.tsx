import { ExternalLink } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import {
  freshnessFromStatuses,
  trustLabelKey,
  type VerificationStatus,
} from '../../lib/officialSources'

type Props = {
  verificationStatus: VerificationStatus | string
  lastVerifiedAt?: string | null
  nextVerificationAt?: string | null
  sourceName?: string | null
  sourceUrl?: string | null
  trustTier?: string | null
  compact?: boolean
}

function formatDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const toneClass: Record<string, string> = {
  ok: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  warn: 'border-amber-200 bg-amber-50 text-amber-950',
  bad: 'border-rose-200 bg-rose-50 text-rose-950',
  unknown: 'border-[#e8e8ed] bg-[#f5f5f7] text-[#1d1d1f]',
}

const dotClass: Record<string, string> = {
  ok: 'bg-emerald-500',
  warn: 'bg-amber-500',
  bad: 'bg-rose-500',
  unknown: 'bg-[#86868b]',
}

export function DocumentFreshnessBadge(props: Props) {
  const { t, language } = useApp()
  const freshness = freshnessFromStatuses({
    verificationStatus: props.verificationStatus,
    nextVerificationAt: props.nextVerificationAt,
    lastVerifiedAt: props.lastVerifiedAt,
  })

  if (props.compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneClass[freshness.tone]}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${dotClass[freshness.tone]}`} aria-hidden />
        {t(freshness.labelKey as 'osm.freshness.current')}
      </span>
    )
  }

  return (
    <aside
      className={`rounded-2xl border px-3.5 py-3 text-sm ${toneClass[freshness.tone]}`}
      aria-label={t('osm.freshness.aria')}
    >
      <div className="flex items-center gap-2 font-semibold">
        <span className={`h-2 w-2 rounded-full ${dotClass[freshness.tone]}`} aria-hidden />
        {t(freshness.labelKey as 'osm.freshness.current')}
      </div>
      <p className="mt-1 text-xs opacity-90">
        {t('osm.freshness.lastChecked')}: {formatDate(props.lastVerifiedAt ?? null, language.code)}
      </p>
      {props.sourceName ? (
        <p className="mt-0.5 text-xs opacity-90">
          {t('osm.freshness.source')}: {props.sourceName}
          {props.trustTier ? ` · ${t(trustLabelKey(props.trustTier) as 'osm.trust.national')}` : ''}
        </p>
      ) : null}
      {props.sourceUrl ? (
        <a
          href={props.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold underline-offset-2 hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          {t('osm.freshness.openSource')}
        </a>
      ) : null}
    </aside>
  )
}

export function LegalContentDisclaimer() {
  const { t } = useApp()
  return (
    <div className="rounded-2xl border border-[#e8e8ed] bg-[#fafafa] px-3.5 py-3 text-xs leading-5 text-[#6e6e73]">
      <p>{t('osm.disclaimer.accuracy')}</p>
      <p className="mt-1.5">{t('osm.disclaimer.notAdvice')}</p>
    </div>
  )
}
