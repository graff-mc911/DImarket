import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import {
  ESTIMATOR_PROJECT_TYPES,
  type EstimatorProjectTypeId,
} from '../../lib/costEstimatorTypes'

const FEATURED_TYPE_IDS: EstimatorProjectTypeId[] = [
  'bathroom',
  'kitchen',
  'renovation',
  'roof',
  'painting',
  'flooring',
]

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
  for (const pt of ESTIMATOR_PROJECT_TYPES) {
    const label = normalize(typeLabel(pt.id))
    const en = normalize(pt.labelEn)
    let score = 0
    if (label === q || en === q) score = 4
    else if (label.startsWith(q) || en.startsWith(q)) score = 3
    else if (label.includes(q) || en.includes(q)) score = 2
    if (score > (best?.score ?? 0)) best = { id: pt.id, score }
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

  const featured = useMemo(
    () => FEATURED_TYPE_IDS.map((id) => ESTIMATOR_PROJECT_TYPES.find((pt) => pt.id === id)!),
    [],
  )

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
    <div className="estimator-intake">
      <div className="estimator-intake__prompt" ref={wrapRef}>
        <label className="estimator-intake__lead" htmlFor="estimator-help-input">
          {t('costEstimator.needHelpWith')}
        </label>
        <div className="estimator-intake__field-wrap">
          <input
            id="estimator-help-input"
            className="estimator-intake__field"
            value={query}
            autoComplete="off"
            placeholder={t('costEstimator.searchPlaceholder')}
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

      <ul className="estimator-intake__cards">
        {featured.map((pt) => {
          const Icon = pt.icon
          const active = selectedId === pt.id
          return (
            <li key={pt.id}>
              <button
                type="button"
                className={
                  active ? 'estimator-intake__card is-active' : 'estimator-intake__card'
                }
                onClick={() => onPick(pt.id, true)}
              >
                <span className="estimator-intake__card-icon" aria-hidden>
                  <Icon className="h-7 w-7" strokeWidth={1.4} />
                </span>
                <span className="estimator-intake__card-label">{typeLabel(pt.id)}</span>
              </button>
            </li>
          )
        })}
      </ul>

      <button type="button" className="estimator-intake__cta" onClick={onSubmit}>
        {t('costEstimator.getQuotes')}
      </button>
    </div>
  )
}
