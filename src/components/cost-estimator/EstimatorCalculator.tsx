import { useEffect, useMemo, useState } from 'react'
import { Minus, Plus, X } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import type { EstimatorState, PricingTierId } from '../../lib/costEstimatorTypes'
import {
  BUILTIN_CALCULATOR_CATALOG,
  budgetLevelFromTier,
  calculateProjectEstimate,
  featuresForProjectType,
  formatCalculatorEuro,
  isCalculatorProjectTypeId,
  loadCalculatorCatalog,
  type CalculatorCatalog,
  type CalculatorEstimate,
} from '../../lib/costCalculator'

type EstimatorCalculatorProps = {
  state: EstimatorState
  onStatePatch: (partial: Partial<EstimatorState>) => void
  onFindContractor: (estimate: CalculatorEstimate) => void
}

export function EstimatorCalculator({
  state,
  onStatePatch,
  onFindContractor,
}: EstimatorCalculatorProps) {
  const { t } = useApp()
  const [catalog, setCatalog] = useState<CalculatorCatalog>(BUILTIN_CALCULATOR_CATALOG)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void loadCalculatorCatalog().then((loaded) => {
      if (!cancelled) setCatalog(loaded)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const projectType = isCalculatorProjectTypeId(state.calculatorTypeId)
    ? state.calculatorTypeId
    : null
  const area = Number(state.measurements.areaSqm) || 0
  const features = featuresForProjectType(catalog, projectType)
  const estimate = useMemo(
    () =>
      calculateProjectEstimate(
        {
          projectType,
          area,
          budgetLevel: budgetLevelFromTier(state.budgetTier),
          includeMaterials: state.includeMaterials !== false,
          selectedFeatureIds: state.selectedFeatureIds || [],
        },
        catalog,
      ),
    [projectType, area, state.budgetTier, state.includeMaterials, state.selectedFeatureIds, catalog],
  )

  const pickType = (slug: string) => {
    if (!slug) {
      onStatePatch({
        calculatorTypeId: null,
        projectTypeId: null,
        selectedFeatureIds: [],
        workPackages: [],
        objectTypeId: null,
      })
      return
    }
    onStatePatch({
      calculatorTypeId: slug,
      selectedFeatureIds: [],
      workPackages: [],
      objectTypeId: null,
    })
  }

  const setArea = (raw: string) => {
    if (raw === '') {
      onStatePatch({ measurements: { ...state.measurements, areaSqm: 0 } })
      return
    }
    const n = Number(raw)
    if (!Number.isFinite(n) || n < 0) return
    onStatePatch({ measurements: { ...state.measurements, areaSqm: n } })
  }

  const addFeature = (id: string) => {
    if ((state.selectedFeatureIds || []).includes(id)) return
    onStatePatch({ selectedFeatureIds: [...(state.selectedFeatureIds || []), id], workPackages: [] })
  }

  const removeFeature = (id: string) => {
    onStatePatch({
      selectedFeatureIds: (state.selectedFeatureIds || []).filter((item) => item !== id),
      workPackages: [],
    })
  }

  const findContractor = () => {
    if (!projectType) {
      setLocalError(t('costCalc.needType'))
      return
    }
    if (!(area > 0)) {
      setLocalError(t('costCalc.needArea'))
      return
    }
    if (!estimate.selectedItems.length) {
      setLocalError(t('costCalc.needFeature'))
      return
    }
    setLocalError(null)
    onFindContractor(estimate)
  }

  return (
    <div className="estimator-calc">
      <div className="estimator-calc__grid">
        <section className="estimator-calc__col" aria-labelledby="estimator-basic-title">
          <p className="estimator-calc__step">1</p>
          <h2 id="estimator-basic-title" className="estimator-calc__title">
            {t('costCalc.basic')}
          </h2>
          <label className="estimator-calc__label" htmlFor="estimator-project-type">
            {t('costCalc.projectType')}
            <select
              id="estimator-project-type"
              className="estimator-calc__input"
              value={projectType || ''}
              onChange={(e) => pickType(e.target.value)}
            >
              <option value="">{t('costCalc.selectType')}</option>
              {catalog.projectTypes
                .filter((item) => item.active)
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {t(item.nameKey as never)}
                  </option>
                ))}
            </select>
          </label>
          <label className="estimator-calc__label" htmlFor="estimator-area">
            {t('costCalc.area')}
            <span className="estimator-calc__input-row">
              <input
                id="estimator-area"
                className="estimator-calc__input"
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                value={state.measurements.areaSqm ? String(state.measurements.areaSqm) : ''}
                onChange={(e) => setArea(e.target.value)}
              />
              <span className="estimator-calc__suffix">м²</span>
            </span>
          </label>
          <fieldset className="estimator-calc__fieldset">
            <legend>{t('costCalc.budget')}</legend>
            <div className="estimator-calc__pills">
              {(
                [
                  ['economy', t('costCalc.budgetLow')],
                  ['standard', t('costCalc.budgetMid')],
                  ['premium', t('costCalc.budgetHigh')],
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
                  aria-pressed={state.budgetTier === id}
                  onClick={() => onStatePatch({ budgetTier: id as PricingTierId })}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="estimator-calc__fieldset">
            <legend>{t('costCalc.materials')}</legend>
            <div className="estimator-calc__pills">
              <button
                type="button"
                className={
                  state.includeMaterials ? 'estimator-calc__pill is-active' : 'estimator-calc__pill'
                }
                aria-pressed={state.includeMaterials}
                onClick={() => onStatePatch({ includeMaterials: true })}
              >
                {t('costCalc.yes')}
              </button>
              <button
                type="button"
                className={
                  !state.includeMaterials ? 'estimator-calc__pill is-active' : 'estimator-calc__pill'
                }
                aria-pressed={!state.includeMaterials}
                onClick={() => onStatePatch({ includeMaterials: false })}
              >
                {t('costCalc.no')}
              </button>
            </div>
          </fieldset>
        </section>

        <section className="estimator-calc__col" aria-labelledby="estimator-features-title">
          <p className="estimator-calc__step">2</p>
          <h2 id="estimator-features-title" className="estimator-calc__title">
            {t('costCalc.features')}
          </h2>
          <p className="estimator-calc__lead">{t('costCalc.pickTypeFirst')}</p>
          {projectType ? (
            <ul className="estimator-calc__features">
              {features.map((item) => {
                const selected = (state.selectedFeatureIds || []).includes(item.id)
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={
                        selected ? 'estimator-calc__feature is-on' : 'estimator-calc__feature'
                      }
                      onClick={() => (selected ? removeFeature(item.id) : addFeature(item.id))}
                      aria-pressed={selected}
                    >
                      {selected ? (
                        <Minus className="h-4 w-4" aria-hidden />
                      ) : (
                        <Plus className="h-4 w-4" aria-hidden />
                      )}
                      <span>{t(item.nameKey as never)}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </section>

        <section
          className="estimator-calc__col estimator-calc__col--total"
          aria-labelledby="estimator-total-title"
        >
          <p className="estimator-calc__step">3</p>
          <h2 id="estimator-total-title" className="estimator-calc__title">
            {t('costCalc.yourProject')}
          </h2>
          <p className="estimator-calc__lead">{t('costCalc.dropFeatures')}</p>
          <ul className="estimator-calc__picked">
            {estimate.selectedItems.length === 0 ? (
              <li className="estimator-calc__empty">{t('costCalc.emptyEstimate')}</li>
            ) : (
              estimate.selectedItems.map((item) => (
                <li key={item.featureId}>
                  <span>
                    ✓ {t(item.nameKey as never)}
                    {item.missingPrice ? ` — ${t('costCalc.missingPrice')}` : ''}
                  </span>
                  <span className="tabular-nums">
                    {item.missingPrice ? '—' : formatCalculatorEuro(item.lineTotal)}
                  </span>
                  <button
                    type="button"
                    className="estimator-calc__remove"
                    aria-label={t('costCalc.removeFeature')}
                    onClick={() => removeFeature(item.featureId)}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </li>
              ))
            )}
          </ul>
          <div className="estimator-calc__total">
            <p>{t('costCalc.projectTotal')}</p>
            <p className="estimator-calc__total-meta">
              {state.includeMaterials ? t('costCalc.laborMaterials') : t('costCalc.laborOnly')}
            </p>
            <p className="estimator-calc__total-value tabular-nums">
              {formatCalculatorEuro(estimate.projectTotal)}
            </p>
          </div>
          {estimate.missingPriceFeatureIds.length ? (
            <p className="estimator-calc__error" role="alert">
              {t('costCalc.missingPrice')}
            </p>
          ) : null}
          {localError ? (
            <p className="estimator-calc__error" role="alert">
              {localError}
            </p>
          ) : null}
          <button
            type="button"
            className="estimator-intake__cta estimator-calc__cta"
            onClick={findContractor}
          >
            {t('costCalc.findContractor')}
          </button>
        </section>
      </div>
    </div>
  )
}
