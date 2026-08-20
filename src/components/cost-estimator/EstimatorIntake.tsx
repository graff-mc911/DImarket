import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import { BZ_HOMEPAGE_CARDS } from '../../lib/buildzoomQuoteFlow'
import {
  ESTIMATOR_PROJECT_TYPES,
  type EstimatorProjectTypeId,
} from '../../lib/costEstimatorTypes'

export const BUILDZOOM_INTAKE_CARDS = BZ_HOMEPAGE_CARDS

function normalize(value: string) {
  return value.trim().toLowerCase()
}

export function matchProjectType(
  query: string,
  typeLabel: (id: EstimatorProjectTypeId) => string,
): EstimatorProjectTypeId | null {
  const q = normalize(query)
  if (!q) return null
  let best: { id: EstimatorProjectTypeId; score: number } | null = null
  const catalog = [
    ...BUILDZOOM_INTAKE_CARDS.map((card) => ({
      id: card.id,
      labels: [typeLabel(card.id)],
    })),
    ...ESTIMATOR_PROJECT_TYPES.map((pt) => ({
      id: pt.id,
      labels: [typeLabel(pt.id), pt.labelEn],
    })),
  ]
  for (const row of catalog) {
    for (const raw of row.labels) {
      const label = normalize(raw)
      let score = 0
      if (label === q) score = 4
      else if (label.startsWith(q)) score = 3
      else if (label.includes(q)) score = 2
      if (score > (best?.score ?? 0)) best = { id: row.id, score }
    }
  }
  return best?.id ?? null
}

type EstimatorIntakeProps = {
  query: string
  selectedId: EstimatorProjectTypeId | null
  typeLabel: (id: EstimatorProjectTypeId) => string
  onQueryChange: (value: string) => void
  onPick: (id: EstimatorProjectTypeId, advance: boolean) => void
  onSubmit: () => void
}

export function EstimatorIntake({
  query,
  selectedId,
  typeLabel,
  onQueryChange,
  onPick,
  onSubmit,
}: EstimatorIntakeProps) {
  const { t } = useApp()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const suggestions = useMemo(() => {
    const q = normalize(query)
    const rows = ESTIMATOR_PROJECT_TYPES.map((pt) => ({
      pt,
      label: typeLabel(pt.id),
    }))
    if (!q) return rows.slice(0, 10)
    return rows
      .filter(
        ({ pt, label }) =>
          normalize(label).includes(q) || normalize(pt.labelEn).includes(q),
      )
      .slice(0, 10)
  }, [query, typeLabel])

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div id="needs-help" className="bz-needs-help">
      <div className="bz-needs-help__gradient" />
      <div className="bz-needs-help__gradient bz-needs-help__gradient--bottom" />
      <div className="bz-needs-help__content">
        <div className="bz-needs-help__prompt" ref={wrapRef}>
          <h2 className="bz-needs-help__lead">
            <label htmlFor="estimator-help-input">{t('costEstimator.needHelpWith')}</label>
          </h2>
          <span className={query ? 'bz-needs-help__cursor is-off' : 'bz-needs-help__cursor'} aria-hidden>
            |
          </span>
          <div className="bz-needs-help__field-wrap">
            <input
              id="estimator-help-input"
              className="bz-needs-help__field"
              value={query}
              autoComplete="off"
              onChange={(e) => {
                onQueryChange(e.target.value)
                setOpen(true)
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  setOpen(false)
                  onSubmit()
                }
                if (e.key === 'Escape') setOpen(false)
              }}
            />
            {open && suggestions.length > 0 ? (
              <ul className="bz-needs-help__dropdown" role="listbox">
                {suggestions.map(({ pt, label }) => (
                  <li key={pt.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selectedId === pt.id}
                      className={
                        selectedId === pt.id
                          ? 'bz-needs-help__option is-active'
                          : 'bz-needs-help__option'
                      }
                      onClick={() => {
                        onPick(pt.id, false)
                        setOpen(false)
                      }}
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <div className="bz-needs-help__categories">
          <p className="bz-needs-help__hint">{t('costEstimator.chooseHint')}</p>
          {BZ_HOMEPAGE_CARDS.map((card) => {
            const active = selectedId === card.id
            return (
              <button
                key={card.id}
                type="button"
                className={active ? 'bz-needs-help__tile is-active' : 'bz-needs-help__tile'}
                onClick={() => onPick(card.id, true)}
              >
                <span className={`bz-needs-help__icon bz-needs-help__icon--${card.icon}`} aria-hidden />
                <span>{t(card.labelKey as never)}</span>
              </button>
            )
          })}
          <button type="button" className="bz-needs-help__cta" onClick={onSubmit}>
            {t('costEstimator.getQuotes')}
          </button>
        </div>
      </div>
    </div>
  )
}
