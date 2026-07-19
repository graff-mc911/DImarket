import type { ReactNode } from 'react'
import { WIZARD_STEP_COUNT } from '../../lib/projectWizard'

type WizardShellProps = {
  step: number
  title: string
  subtitle?: string
  children: ReactNode
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  backLabel?: string
  nextDisabled?: boolean
  busy?: boolean
}

export function WizardShell({
  step,
  title,
  subtitle,
  children,
  onBack,
  onNext,
  nextLabel = 'Continue',
  backLabel = 'Back',
  nextDisabled,
  busy,
}: WizardShellProps) {
  const pct = Math.round((step / WIZARD_STEP_COUNT) * 100)

  return (
    <div className="mx-auto max-w-3xl py-6 pb-24 lg:pb-8">
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between text-xs text-[var(--ink-500)]">
          <span>
            Step {step} / {WIZARD_STEP_COUNT}
          </span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#e7e7e7]">
          <div
            className="h-full rounded-full bg-[#ff9900] transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="amazon-section-card p-5 md:p-8">
        <h1 className="text-2xl font-bold text-[var(--ink-900)] md:text-3xl">{title}</h1>
        {subtitle ? (
          <p className="mt-2 text-sm leading-6 text-[var(--ink-600)]">{subtitle}</p>
        ) : null}

        <div className="mt-6">{children}</div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#e7e7e7] pt-5">
          {onBack ? (
            <button type="button" onClick={onBack} className="btn-secondary rounded-sm px-5 py-2.5 text-sm">
              {backLabel}
            </button>
          ) : (
            <span />
          )}
          {onNext ? (
            <button
              type="button"
              onClick={onNext}
              disabled={nextDisabled || busy}
              className="btn-primary rounded-sm px-6 py-2.5 text-sm disabled:opacity-60"
            >
              {busy ? '…' : nextLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
