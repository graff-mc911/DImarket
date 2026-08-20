import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
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
  type EstimatorMainCategory,
} from '../../lib/estimatorMainCategories'
import { marketplaceCategoryLabel } from '../../lib/marketplaceCategories'

/** Same primary types as BuildZoom /cost. */
const PRIMARY_SLUGS = ['bathroom', 'flooring', 'kitchen', 'roofing', 'windows'] as const

const EXTRA_TYPES: EstimatorMainCategory[] = [
  { id: 'bathroom', slug: 'bathroom', name: 'Bathroom', icon_key: 'droplets', is_main: true, name_i18n: {} },
  { id: 'kitchen', slug: 'kitchen', name: 'Kitchen', icon_key: 'wrench', is_main: true, name_i18n: {} },
  { id: 'flooring', slug: 'flooring', name: 'Flooring', icon_key: 'square', is_main: true, name_i18n: {} },
  { id: 'roofing', slug: 'roofing', name: 'Roofing', icon_key: 'home', is_main: true, name_i18n: {} },
  { id: 'windows', slug: 'windows', name: 'Windows', icon_key: 'aperture', is_main: true, name_i18n: {} },
]

type EstimatorCalculatorProps = {
  state: EstimatorState
  typeLabel: (id: EstimatorProjectTypeId) => string
  onStatePatch: (partial: Partial<EstimatorState>) => void
  onGetQuotes: (preview: CalculatorPreview) => void
}

export function EstimatorCalculator({
  state,
  typeLabel,
  onStatePatch,
  onGetQuotes,
}: EstimatorCalculatorProps) {
  const { t, language } = useApp()
  const lang = language.code
  const [mains, setMains] = useState<EstimatorMainCategory[]>(EXTRA_TYPES)

  useEffect(() => {
    let cancelled = false
    void loadEstimatorMainCategories().then((rows) => {
      if (cancelled) return
      const bySlug = new Map<string, EstimatorMainCategory>()
      for (const extra of EXTRA_TYPES) bySlug.set(extra.slug, extra)
      for (const row of rows) {
        if (!bySlug.has(row.slug)) bySlug.set(row.slug, row)
      }
      const ordered = [
        ...(PRIMARY_SLUGS.map((slug) => bySlug.get(slug)).filter(Boolean) as EstimatorMainCategory[]),
        ...[...bySlug.values()].filter(
          (cat) => !(PRIMARY_SLUGS as readonly string[]).includes(cat.slug),
        ),
      ]
      setMains(ordered)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const labelOf = (cat: EstimatorMainCategory) => {
    if (
      cat.slug === 'bathroom' ||
      cat.slug === 'kitchen' ||
      cat.slug === 'flooring' ||
      cat.slug === 'windows'
    ) {
      return typeLabel(estimatorTypeFromCatalogId(cat.slug))
    }
    if (cat.slug === 'roofing') return typeLabel('roof')
    return marketplaceCategoryLabel(cat, lang)
  }

  const catalogId = state.calculatorTypeId || state.projectTypeId
  const features = featuresForCatalog(catalogId)
  const preview = useMemo(() => computeCalculatorPreview(state, lang), [state, lang])
  const selectedCat = mains.find((cat) => cat.slug === catalogId)

  const pickCatalog = (slug: string) => {
    if (!slug) {
      onStatePatch({
        calculatorTypeId: null,
        projectTypeId: null,
        objectTypeId: null,
        workPackages: [],
        selectedFeatureIds: [],
      })
      return
    }
    onStatePatch({
      calculatorTypeId: slug,
      projectTypeId: estimatorTypeFromCatalogId(slug),
      objectTypeId: null,
      workPackages: [],
      selectedFeatureIds: [],
    })
  }

  const toggleFeature = (id: string) => {
    const selected = new Set(state.selectedFeatureIds)
    if (selected.has(id)) selected.delete(id)
    else selected.add(id)
    onStatePatch({
      selectedFeatureIds: [...selected],
      workPackages: [],
    })
  }

  return (
    <div className="estimator-calc">
      <div className="estimator-calc__grid">
        <section className="estimator-calc__col" aria-labelledby="estimator-basic-title">
          <p className="estimator-calc__step">1</p>
          <h2 id="estimator-basic-title" className="estimator-calc__title">
            {t('costEstimator.calc.basic')}
          </h2>
          <label className="estimator-calc__label" htmlFor="estimator-project-type">
            {t('costEstimator.calc.projectType')}
            <select
              id="estimator-project-type"
              className="estimator-calc__input"
              value={catalogId || ''}
              onChange={(e) => pickCatalog(e.target.value)}
            >
              <option value="">{t('costEstimator.calc.selectType')}</option>
              {mains.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {labelOf(cat)}
                </option>
              ))}
            </select>
          </label>
          <label className="estimator-calc__label" htmlFor="estimator-area">
            {t('costEstimator.calc.area')}
            <span className="estimator-calc__input-row">
              <input
                id="estimator-area"
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
                  ['economy', t('costEstimator.calc.budgetLow')],
                  ['standard', t('costEstimator.calc.budgetMid')],
                  ['premium', t('costEstimator.calc.budgetHigh')],
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
              <p className="estimator-calc__total-loc">
                {state.location.locationLabel || state.location.city}
              </p>
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

      <section className="estimator-calc__faq" aria-labelledby="estimator-faq-title">
        <h2 id="estimator-faq-title" className="estimator-calc__faq-title">
          {t('costEstimator.calc.faqTitle')}
        </h2>
        <details>
          <summary>{t('costEstimator.calc.faq1q')}</summary>
          <p>{t('costEstimator.calc.faq1a')}</p>
        </details>
        <details>
          <summary>{t('costEstimator.calc.faq2q')}</summary>
          <p>{t('costEstimator.calc.faq2a')}</p>
        </details>
        <details>
          <summary>{t('costEstimator.calc.faq3q')}</summary>
          <p>{t('costEstimator.calc.faq3a')}</p>
        </details>
      </section>
    </div>
  )
}
