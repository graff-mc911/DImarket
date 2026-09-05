import { LayoutDashboard, Megaphone, Bot } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { isSiteOwner } from '../lib/siteOwner'

type Props = {
  /** Compact strip for dashboards; default is a short card. */
  variant?: 'banner' | 'card'
  className?: string
}

/**
 * Visible entry to the owner cabinet (/dashboard) and optional AI/marketing tools.
 * Shown only for the site owner — including mobile, where Header Account is hidden.
 */
export function OwnerCabinetEntry({ variant = 'card', className = '' }: Props) {
  const { user, profile, t } = useApp()
  if (!user || !isSiteOwner(profile, user.email)) return null

  const go = (path: string) => navigateTo(path)

  if (variant === 'banner') {
    return (
      <div
        className={`mb-4 flex flex-col gap-3 rounded-2xl border border-[rgba(148,163,184,0.35)] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
        role="region"
        aria-label={t('ownerDash.controlTitle')}
      >
        <div className="min-w-0">
          <p className="text-[13px] font-semibold tracking-tight text-[#2f2a24]">
            {t('ownerDash.controlTitle')}
          </p>
          <p className="mt-0.5 text-[12px] text-[#6f665d]">{t('ownerDash.controlHint')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => go('/dashboard')}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#2f2a24] px-3.5 py-2 text-[12px] font-semibold text-white"
          >
            <LayoutDashboard className="h-3.5 w-3.5" aria-hidden />
            {t('header.dashboard')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <section
      className={`rounded-2xl border border-[rgba(148,163,184,0.22)] bg-[#fafafa] p-4 ${className}`}
      aria-label={t('ownerDash.controlTitle')}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6f665d]">
        {t('nav.ownerSection')}
      </p>
      <h2 className="mt-1 text-base font-semibold tracking-tight text-[#2f2a24]">
        {t('ownerDash.controlTitle')}
      </h2>
      <p className="mt-1 text-sm text-[#6f665d]">{t('ownerDash.controlHint')}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => go('/dashboard')}
          className="flex items-center gap-2 rounded-xl border border-[rgba(148,163,184,0.22)] bg-white px-3 py-2.5 text-left text-sm font-semibold text-[#2f2a24]"
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden />
          {t('header.dashboard')}
        </button>
        <button
          type="button"
          onClick={() => go('/admin/ai')}
          className="flex items-center gap-2 rounded-xl border border-[rgba(148,163,184,0.22)] bg-white px-3 py-2.5 text-left text-sm font-semibold text-[#2f2a24]"
        >
          <Bot className="h-4 w-4 shrink-0" aria-hidden />
          {t('ai.admin.title')}
        </button>
        <button
          type="button"
          onClick={() => go('/admin/marketing-agent')}
          className="flex items-center gap-2 rounded-xl border border-[rgba(148,163,184,0.22)] bg-white px-3 py-2.5 text-left text-sm font-semibold text-[#2f2a24]"
        >
          <Megaphone className="h-4 w-4 shrink-0" aria-hidden />
          {t('header.marketingAgent')}
        </button>
      </div>
    </section>
  )
}
