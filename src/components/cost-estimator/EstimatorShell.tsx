import type { ReactNode } from 'react'
import { useApp } from '../../contexts/AppContext'
import { ESTIMATOR_STEP_COUNT } from '../../lib/costEstimatorTypes'

const STEP_KEYS = [
  'costEstimator.nav.type',
  'costEstimator.nav.details',
  'costEstimator.nav.files',
  'costEstimator.nav.location',
  'costEstimator.nav.size',
  'costEstimator.nav.results',
] as const

type EstimatorShellProps = {
  step: number
  title?: string
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
  variant?: 'wizard' | 'intake'
}

/** Cost-estimator chrome — same owner-cabinet language as home. */
export function EstimatorShell({
  step,
  title,
  subtitle,
  children,
  onBack,
  onNext,
  nextLabel,
  backLabel,
  nextDisabled,
  busy,
  error,
  footerExtra,
  variant = 'wizard',
}: EstimatorShellProps) {
  const { t } = useApp()
  const intake = variant === 'intake'
  const pct = Math.round((Math.min(step, ESTIMATOR_STEP_COUNT) / ESTIMATOR_STEP_COUNT) * 100)
  const continueLabel = nextLabel || t('common.continue')
  const backText = backLabel || t('common.back')

  return (
    <div className={`home-premium estimator-page${intake ? ' estimator-page--intake' : ''}`}>
      <div className="estimator-page__inner">
        <p className="estimator-page__brand dimarket-categories__eyebrow">
          {t('costEstimator.brandLine')}
        </p>
        {!intake ? (
          <div className="estimator-page__progress">
            <div className="estimator-page__progress-meta">
              <span>
                {t('costEstimator.stepOf')
                  .replace('{current}', String(Math.min(step, ESTIMATOR_STEP_COUNT)))
                  .replace('{total}', String(ESTIMATOR_STEP_COUNT))}
              </span>
              <span className="tabular-nums">{pct}%</span>
            </div>
            <div className="estimator-page__bar">
              <div className="estimator-page__bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="estimator-page__steps">
              {STEP_KEYS.map((key, i) => (
                <span
                  key={key}
                  className={
                    i + 1 === step ? 'is-current' : i + 1 < step ? 'is-done' : undefined
                  }
                >
                  {t(key)}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className={`cabinet-sheet estimator-page__card${intake ? ' estimator-page__card--intake' : ''}`}>
          {title ? (
            <div className="cabinet-sheet__head">
              <h1 className="estimator-page__title dimarket-categories__title">{title}</h1>
              {subtitle ? <p className="estimator-page__subtitle">{subtitle}</p> : null}
            </div>
          ) : null}

          {error ? <p className="estimator-page__error">{error}</p> : null}

          <div className={intake ? 'estimator-page__intake-body' : 'mt-6'}>{children}</div>

          {(onBack || onNext || footerExtra) && (
            <div className="estimator-page__footer">
              {onBack ? (
                <button type="button" className="estimator-page__back" onClick={onBack}>
                  {backText}
                </button>
              ) : (
                <span />
              )}
              <div className="estimator-page__footer-end">
                {footerExtra}
                {onNext ? (
                  <button
                    type="button"
                    className="estimator-page__next"
                    onClick={onNext}
                    disabled={nextDisabled || busy}
                  >
                    {busy ? t('costEstimator.working') : continueLabel}
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
