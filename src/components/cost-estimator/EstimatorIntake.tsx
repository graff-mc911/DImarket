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

/** Intake UI in home cabinet language (no BuildZoom yellow wash). */
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
    <div id="needs-help" className="estimator-intake">
      <div className="estimator-intake__prompt" ref={wrapRef}>
        <h2 className="estimator-intake__lead">
          <label htmlFor="estimator-help-input">{t('costEstimator.needHelpWith')}</label>
        </h2>
        <div className="estimator-intake__field-wrap">
          <input
            id="estimator-help-input"
            className="estimator-intake__field"
            value={query}
            autoComplete="off"
            placeholder="…"
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
            <ul className="estimator-intake__dropdown" role="listbox">
              {suggestions.map(({ pt, label }) => (
                <li key={pt.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selectedId === pt.id}
                    className={
                      selectedId === pt.id
                        ? 'estimator-intake__option is-active'
                        : 'estimator-intake__option'
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

      <p className="estimator-intake__hint">{t('costEstimator.chooseHint')}</p>

      <div className="cabinet-sheet__grid estimator-intake__grid" role="list">
        {BZ_HOMEPAGE_CARDS.map((card) => {
          const active = selectedId === card.id
          return (
            <button
              key={card.id}
              type="button"
              role="listitem"
              className={
                active ? 'estimator-intake__tile is-active' : 'estimator-intake__tile'
              }
              onClick={() => onPick(card.id, true)}
            >
              <span
                className={`estimator-intake__icon estimator-intake__icon--${card.icon}`}
                aria-hidden
              />
              <span className="estimator-intake__tile-label">{t(card.labelKey as never)}</span>
            </button>
          )
        })}
      </div>

      <div className="estimator-intake__actions">
        <button type="button" className="estimator-intake__cta" onClick={onSubmit}>
          {t('costEstimator.getQuotes')}
        </button>
      </div>
    </div>
  )
}
