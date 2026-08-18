import { useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { resolveCategoryIcon, resolveCategoryIconColor } from '../../lib/categoryIcons'
import { formatEuro } from '../../lib/costEstimator'
import type { EstimatorProjectTypeId, EstimatorState, PricingTierId } from '../../lib/costEstimatorTypes'
import {
  computeCalculatorPreview,
  featureLabel,
  featuresForCatalog,
  type CalculatorPreview,
} from '../../lib/estimatorCalculator'
import {
  estimatorTypeFromCatalogId,
  loadEstimatorMainCategories,
  matchMainCategory,
  type EstimatorMainCategory,
} from '../../lib/estimatorMainCategories'
import { marketplaceCategoryLabel } from '../../lib/marketplaceCategories'

const FEATURED_SLUGS = [
  'bathroom',
  'kitchen',
  'renovation',
  'roofing',
  'painting',
  'flooring',
  'windows',
] as const

const EXTRA_TYPES: EstimatorMainCategory[] = [
  { id: 'bathroom', slug: 'bathroom', name: 'Bathroom', icon_key: 'droplets', is_main: true },
  { id: 'kitchen', slug: 'kitchen', name: 'Kitchen', icon_key: 'wrench', is_main: true },
  { id: 'renovation', slug: 'renovation', name: 'Renovation', icon_key: 'hammer', is_main: true },
]

type EstimatorCalculatorProps = {
  query: string
  state: EstimatorState
  typeLabel: (id: EstimatorProjectTypeId) => string
  onQueryChange: (value: string) => void
  onStatePatch: (partial: Partial<EstimatorState>) => void
  onGetQuotes: (preview: CalculatorPreview) => void
}

export function EstimatorCalculator({
  query,
  state,
  typeLabel,
  onQueryChange,
  onStatePatch,
  onGetQuotes,
}: EstimatorCalculatorProps) {
  const { t, language } = useApp()
  const lang = language.code
  const [open, setOpen] = useState(false)
  const [mains, setMains] = useState<EstimatorMainCategory[]>([])
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    void loadEstimatorMainCategories().then((rows) => {
      if (cancelled) return
      const bySlug = new Map(rows.map((row) => [row.slug, row]))
      for (const extra of EXTRA_TYPES) {
        if (!bySlug.has(extra.slug)) bySlug.set(extra.slug, extra)
      }
      setMains([...bySlug.values()])
    })
    return () => {
      cancelled = true
    }
  }, [])

  const labelOf = (cat: EstimatorMainCategory) => {
    if (cat.slug === 'bathroom' || cat.slug === 'kitchen' || cat.slug === 'renovation') {
      const id = estimatorTypeFromCatalogId(cat.slug)
      return typeLabel(id)
    }
    return marketplaceCategoryLabel(cat, lang)
  }

  const catalogId = state.calculatorTypeId || state.projectTypeId
  const features = featuresForCatalog(catalogId)
  const preview = useMemo(
    () => computeCalculatorPreview(state, lang),
    [state, lang],
  )

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = mains.map((cat) => ({ cat, label: labelOf(cat) }))
    if (!q) return rows.slice(0, 12)
    return rows
      .filter(
        ({ cat, label }) =>
          label.toLowerCase().includes(q) ||
          cat.slug.toLowerCase().includes(q) ||
          (cat.name || '').toLowerCase().includes(q),
      )
      .slice(0, 12)
  }, [query, mains, lang])

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const pickCatalog = (cat: EstimatorMainCategory) => {
    const engineId = estimatorTypeFromCatalogId(cat.slug)
    onQueryChange(labelOf(cat))
    onStatePatch({
      calculatorTypeId: cat.slug,
      projectTypeId: engineId,
      selectedFeatureIds: [],
    })
    setOpen(false)
  }

  const submitSearch = () => {
    const matched = matchMainCategory(query, mains, labelOf)
    if (matched) {
      pickCatalog(matched)
      return
    }
    if (catalogId) {
      onGetQuotes(preview)
      return
    }
  }

  const toggleFeature = (id: string) => {
    const selected = new Set(state.selectedFeatureIds)
    if (selected.has(id)) selected.delete(id)
    else selected.add(id)
    onStatePatch({ selectedFeatureIds: [...selected] })
  }

  const featured = FEATURED_SLUGS.map(
    (slug) => mains.find((cat) => cat.slug === slug) || EXTRA_TYPES.find((cat) => cat.slug === slug),
  ).filter(Boolean) as EstimatorMainCategory[]

  const selectedCat = mains.find((cat) => cat.slug === catalogId)

  return (
    <div className="estimator-calc">
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
                submitSearch()
              }
              if (e.key === 'Escape') setOpen(false)
            }}
          />
          {open && suggestions.length > 0 ? (
            <ul className="estimator-intake__dropdown" role="listbox">
              {suggestions.map(({ cat, label }) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={catalogId === cat.slug}
                    className={
                      catalogId === cat.slug
                        ? 'estimator-intake__option is-active'
                        : 'estimator-intake__option'
                    }
                    onClick={() => pickCatalog(cat)}
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
      <ul className="estimator-intake__cards estimator-intake__cards--featured">
        {featured.map((cat) => {
          const Icon = resolveCategoryIcon(cat.icon_key)
          const colors = resolveCategoryIconColor(cat.slug)
          const active = catalogId === cat.slug
          return (
            <li key={cat.slug}>
              <button
                type="button"
                className={active ? 'estimator-intake__card is-active' : 'estimator-intake__card'}
                onClick={() => pickCatalog(cat)}
              >
                <span className="estimator-intake__card-icon" style={{ color: colors.fg }} aria-hidden>
                  <Icon className="h-7 w-7" strokeWidth={1.4} />
                </span>
                <span className="estimator-intake__card-label">{labelOf(cat)}</span>
              </button>
            </li>
          )
        })}
      </ul>

      {mains.length > featured.length ? (
        <>
          <p className="estimator-intake__hint">{t('marketplace.mainCategories')}</p>
          <ul className="estimator-intake__cards">
            {mains
              .filter((cat) => !FEATURED_SLUGS.includes(cat.slug as (typeof FEATURED_SLUGS)[number]))
              .map((cat) => {
                const Icon = resolveCategoryIcon(cat.icon_key)
                const colors = resolveCategoryIconColor(cat.slug)
                const active = catalogId === cat.slug
                return (
                  <li key={cat.id}>
                    <button
                      type="button"
                      className={
                        active ? 'estimator-intake__card is-active' : 'estimator-intake__card'
                      }
                      onClick={() => pickCatalog(cat)}
                    >
                      <span
                        className="estimator-intake__card-icon"
                        style={{ color: colors.fg }}
                        aria-hidden
                      >
                        <Icon className="h-6 w-6" strokeWidth={1.4} />
                      </span>
                      <span className="estimator-intake__card-label">{labelOf(cat)}</span>
                    </button>
                  </li>
                )
              })}
          </ul>
        </>
      ) : null}

      <div className="estimator-calc__grid">
        <section className="estimator-calc__col" aria-labelledby="estimator-basic-title">
          <p className="estimator-calc__step">1</p>
          <h2 id="estimator-basic-title" className="estimator-calc__title">
            {t('costEstimator.calc.basic')}
          </h2>
          <label className="estimator-calc__label">
            {t('costEstimator.calc.projectType')}
            <select
              className="estimator-calc__input"
              value={catalogId || ''}
              onChange={(e) => {
                const cat = mains.find((row) => row.slug === e.target.value)
                if (cat) pickCatalog(cat)
              }}
            >
              <option value="">{t('costEstimator.calc.selectType')}</option>
              {mains.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {labelOf(cat)}
                </option>
              ))}
            </select>
          </label>
          <label className="estimator-calc__label">
            {t('costEstimator.calc.area')}
            <span className="estimator-calc__input-row">
              <input
                className="estimator-calc__input"
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                value={state.measurements.areaSqm || ''}
                onChange={(e) =>
                  onStatePatch({
                    measurements: {
                      ...state.measurements,
                      areaSqm: e.target.value === '' ? 0 : Number(e.target.value),
                    },
                  })
                }
              />
              <span className="estimator-calc__suffix">m²</span>
            </span>
          </label>
          <fieldset className="estimator-calc__fieldset">
            <legend>{t('costEstimator.calc.budget')}</legend>
            <div className="estimator-calc__pills">
              {(
                [
                  ['economy', t('costEstimator.economy')],
                  ['standard', t('costEstimator.standard')],
                  ['premium', t('costEstimator.premium')],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={
                    state.budgetTier === id
                      ? 'estimator-calc__pill is-active'
                      : 'estimator-calc__pill'
                  }
                  onClick={() => onStatePatch({ budgetTier: id as PricingTierId })}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="estimator-calc__fieldset">
            <legend>{t('costEstimator.calc.materials')}</legend>
            <div className="estimator-calc__pills">
              <button
                type="button"
                className={
                  state.includeMaterials ? 'estimator-calc__pill is-active' : 'estimator-calc__pill'
                }
                onClick={() => onStatePatch({ includeMaterials: true })}
              >
                {t('costEstimator.calc.yes')}
              </button>
              <button
                type="button"
                className={
                  !state.includeMaterials ? 'estimator-calc__pill is-active' : 'estimator-calc__pill'
                }
                onClick={() => onStatePatch({ includeMaterials: false })}
              >
                {t('costEstimator.calc.no')}
              </button>
            </div>
          </fieldset>
        </section>

        <section className="estimator-calc__col" aria-labelledby="estimator-features-title">
          <p className="estimator-calc__step">2</p>
          <h2 id="estimator-features-title" className="estimator-calc__title">
            {t('costEstimator.calc.features')}
          </h2>
          {!catalogId ? (
            <p className="estimator-calc__empty">{t('costEstimator.calc.pickTypeFirst')}</p>
          ) : (
            <ul className="estimator-calc__features">
              {features.map((item) => {
                const checked = state.selectedFeatureIds.includes(item.id)
                return (
                  <li key={item.id}>
                    <label className={checked ? 'estimator-calc__feature is-on' : 'estimator-calc__feature'}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleFeature(item.id)}
                      />
                      <span>{featureLabel(item, lang)}</span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="estimator-calc__col estimator-calc__col--total" aria-labelledby="estimator-total-title">
          <p className="estimator-calc__step">3</p>
          <h2 id="estimator-total-title" className="estimator-calc__title">
            {t('costEstimator.calc.estimate')}
          </h2>
          <p className="estimator-calc__project">
            {selectedCat ? labelOf(selectedCat) : t('costEstimator.calc.yourProject')}
          </p>
          <ul className="estimator-calc__picked">
            {preview.lines.length === 0 ? (
              <li className="estimator-calc__empty">{t('costEstimator.calc.dropFeatures')}</li>
            ) : (
              preview.lines.map((line) => (
                <li key={line.id}>
                  <span>{line.label}</span>
                  <span className="tabular-nums">{formatEuro(line.amount)}</span>
                  <button
                    type="button"
                    className="estimator-calc__remove"
                    aria-label={t('costEstimator.delete')}
                    onClick={() => toggleFeature(line.id)}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </li>
              ))
            )}
          </ul>
          <div className="estimator-calc__total">
            <p>{t('costEstimator.calc.projectTotal')}</p>
            <p className="estimator-calc__total-meta">{t('costEstimator.calc.laborMaterials')}</p>
            <p className="estimator-calc__total-value tabular-nums">{formatEuro(preview.total)}</p>
            {state.location.city ? (
              <p className="estimator-calc__total-loc">{state.location.locationLabel || state.location.city}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="estimator-intake__cta estimator-calc__cta"
            onClick={() => onGetQuotes(preview)}
          >
            {t('costEstimator.getQuotes')}
          </button>
        </section>
      </div>
    </div>
  )
}

