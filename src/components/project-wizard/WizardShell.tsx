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
  error?: string | null
}

const STEP_LABELS = [
  'Category',
  'Details',
  'Media',
  'Location',
  'Budget',
  'Timing',
  'Publish',
]

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
  error,
}: WizardShellProps) {
  const pct = Math.round((step / WIZARD_STEP_COUNT) * 100)

  return (
    <div className="create-project-page min-h-[calc(100vh-4rem)] bg-[#f3f0ea] px-4 py-8 pb-28 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[720px]">
        <p className="mb-2 text-center text-[13px] font-medium tracking-wide text-[#8a8178]">
          DiMarket · Project
        </p>
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between text-[12px] text-[#8a8178]">
            <span>
              Step {step} of {WIZARD_STEP_COUNT}
            </span>
            <span className="font-medium tabular-nums">{pct}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-[rgba(148,163,184,0.35)]">
            <div
              className="h-full rounded-full bg-[#2f2a24] transition-all duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-3 hidden gap-1 sm:flex">
            {STEP_LABELS.map((label, i) => (
              <span
                key={label}
                className={
                  'flex-1 truncate text-center text-[10px] font-medium ' +
                  (i + 1 === step ? 'text-[#2f2a24]' : i + 1 < step ? 'text-[#6f665d]' : 'text-[#aeaeb2]')
                }
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-none border border-black/[0.04] bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.06)] sm:p-10">
          <h1 className="text-center text-[28px] font-semibold leading-tight tracking-[-0.03em] text-[#2f2a24] sm:text-[34px]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mx-auto mt-3 max-w-md text-center text-[15px] leading-6 text-[#6f665d]">
              {subtitle}
            </p>
          ) : null}

          {error ? (
            <p className="mt-5 rounded-2xl bg-[#fff2f2] px-4 py-3 text-center text-[13px] font-medium text-[#c41e3a]">
              {error}
            </p>
          ) : null}

          <div className="mt-8">{children}</div>

          <div className="mt-10 flex items-center justify-between gap-3 border-t border-[#f0f0f2] pt-6">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="rounded-full px-5 py-3 text-[15px] font-medium text-[#2f2a24] transition hover:bg-[#f3f0ea]"
              >
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
                className="rounded-full bg-[#2f2a24] px-7 py-3 text-[15px] font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? 'Publishing…' : nextLabel}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
