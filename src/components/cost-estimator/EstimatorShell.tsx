import type { ReactNode } from 'react'
import { ESTIMATOR_STEP_COUNT } from '../../lib/costEstimatorTypes'

const STEP_LABELS = ['Type', 'Details', 'Files', 'Location', 'Size', 'Results']

type EstimatorShellProps = {
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
  footerExtra?: ReactNode
}

export function EstimatorShell({
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
  footerExtra,
}: EstimatorShellProps) {
  const pct = Math.round((Math.min(step, ESTIMATOR_STEP_COUNT) / ESTIMATOR_STEP_COUNT) * 100)

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f5f5f7] px-4 py-8 pb-28 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[820px]">
        <p className="mb-2 text-center text-[13px] font-medium tracking-wide text-[#86868b]">
          DiMarket · AI Cost Estimator
        </p>
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between text-[12px] text-[#86868b]">
            <span>
              Step {Math.min(step, ESTIMATOR_STEP_COUNT)} of {ESTIMATOR_STEP_COUNT}
            </span>
            <span className="font-medium tabular-nums">{pct}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-[#d2d2d7]">
            <div
              className="h-full rounded-full bg-[#1d1d1f] transition-all duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-3 hidden gap-1 sm:flex">
            {STEP_LABELS.map((label, i) => (
              <span
                key={label}
                className={
                  'flex-1 truncate text-center text-[10px] font-medium ' +
                  (i + 1 === step
                    ? 'text-[#1d1d1f]'
                    : i + 1 < step
                      ? 'text-[#6e6e73]'
                      : 'text-[#aeaeb2]')
                }
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-black/[0.04] bg-white/90 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl sm:p-10">
          <h1 className="text-center text-[28px] font-semibold leading-tight tracking-[-0.03em] text-[#1d1d1f] sm:text-[34px]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mx-auto mt-3 max-w-md text-center text-[15px] leading-6 text-[#6e6e73]">
              {subtitle}
            </p>
          ) : null}

          {error ? (
            <p className="mt-5 rounded-2xl bg-[#fff2f2] px-4 py-3 text-center text-[13px] font-medium text-[#c41e3a]">
              {error}
            </p>
          ) : null}

          <div className="mt-8">{children}</div>

          {(onBack || onNext || footerExtra) && (
            <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[#f0f0f2] pt-6">
              {onBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  className="rounded-full px-5 py-3 text-[15px] font-medium text-[#1d1d1f] transition hover:bg-[#f5f5f7]"
                >
                  {backLabel}
                </button>
              ) : (
                <span />
              )}
              <div className="flex flex-wrap items-center justify-end gap-2">
                {footerExtra}
                {onNext ? (
                  <button
                    type="button"
                    onClick={onNext}
                    disabled={nextDisabled || busy}
                    className="rounded-full bg-[#1d1d1f] px-7 py-3 text-[15px] font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {busy ? 'Working…' : nextLabel}
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
