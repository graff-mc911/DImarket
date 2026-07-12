import { ArrowRight, CheckCircle2, Circle } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import type { OnboardingState } from '../lib/onboardingProgress'

interface OnboardingChecklistProps {
  state: OnboardingState
  role: 'professional' | 'company' | 'advertiser'
}

export function OnboardingChecklist({ state, role }: OnboardingChecklistProps) {
  const { t } = useApp()

  const titleKey =
    role === 'company'
      ? 'onboarding.company.title'
      : role === 'advertiser'
        ? 'onboarding.advertiser.title'
        : 'onboarding.pro.title'

  return (
    <section className="mb-6 rounded-[24px] border border-[rgba(99,102,241,0.22)] bg-[rgba(99,102,241,0.06)] p-5 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#4338ca]">
            {t('onboarding.eyebrow')}
          </p>
          <h2 className="mt-1 text-xl font-extrabold text-[var(--ink-900)]">
            {t(titleKey)}
          </h2>
          <p className="mt-1 text-sm text-[var(--ink-600)]">
            {state.completedCount}/{state.totalCount} {t('onboarding.progress')}
          </p>
        </div>

        {state.isReady ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(34,197,94,0.14)] px-3 py-1.5 text-xs font-bold text-[#15803d]">
            <CheckCircle2 className="h-4 w-4" />
            {t('onboarding.readyBadge')}
          </span>
        ) : (
          <span className="text-xs font-semibold text-[var(--ink-500)]">
            {t('onboarding.freeNote')}
          </span>
        )}
      </div>

      <ul className="mt-4 space-y-2">
        {state.steps.map((step) => (
          <li
            key={step.id}
            className="flex items-center gap-2.5 rounded-[14px] border border-white/60 bg-white/50 px-3 py-2.5 text-sm"
          >
            {step.done ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16a34a]" />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-[var(--ink-400)]" />
            )}
            <span className={step.done ? 'text-[var(--ink-600)]' : 'font-medium text-[var(--ink-800)]'}>
              {t(step.labelKey)}
            </span>
          </li>
        ))}
      </ul>

      {role === 'advertiser' && (
        <button
          type="button"
          onClick={() => {
          try {
            localStorage.setItem('dimarket_onboarding_visited_ads', '1')
          } catch {
            /* ignore */
          }
          navigateTo('/advertising')
        }}
          className="btn-primary mt-4 inline-flex items-center gap-2 rounded-full"
        >
          <span>{t('onboarding.advertiser.openAds')}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </section>
  )
}
