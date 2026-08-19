import { useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { formatEuro } from '../../lib/costEstimator'
import type {
  EstimatorObjectTypeId,
  EstimatorProjectTypeId,
  EstimatorState,
  PricingTierId,
} from '../../lib/costEstimatorTypes'
import {
  computeCalculatorPreview,
  featureLabel,
  featuresForCatalog,
  type CalculatorPreview,
} from '../../lib/estimatorCalculator'
import { isEstimatorProjectSlug } from '../../lib/estimatorMainCategories'
import {
  CONSTRUCTION_WORK_ORDER,
  ESTIMATOR_OBJECT_TYPES,
  addWorkPackage,
  flattenWorkFeatureIds,
  objectTypeLabel,
  packagesFromRecommended,
  sortWorkPackages,
  workTypeLabel,
} from '../../lib/estimatorObjectTypes'

const WORK_SLUGS = CONSTRUCTION_WORK_ORDER.filter(
  (slug) => isEstimatorProjectSlug(slug) || slug === 'doors',
)

type EstimatorCalculatorProps = {
  state: EstimatorState
  typeLabel: (id: EstimatorProjectTypeId) => string
  onStatePatch: (partial: Partial<EstimatorState>) => void
  onGetQuotes: (preview: CalculatorPreview) => void
}

export function EstimatorCalculator({
  state,
  onStatePatch,
  onGetQuotes,
}: EstimatorCalculatorProps) {
  const { t, language } = useApp()
  const lang = language.code
  const [workToAdd, setWorkToAdd] = useState('')

  const packages = sortWorkPackages(state.workPackages || [])
  const activeWorkId = state.calculatorTypeId || packages[0]?.workTypeId || ''
  const activePack = packages.find((pack) => pack.workTypeId === activeWorkId) || packages[0]
  const features = featuresForCatalog(activePack?.workTypeId)
  const preview = useMemo(() => computeCalculatorPreview(state, lang), [state, lang])
  const objectLabel = objectTypeLabel(state.objectTypeId, lang) || t('costEstimator.calc.yourProject')

  const patchDerived = (partial: Partial<EstimatorState>) => {
    const workPackages = sortWorkPackages(partial.workPackages ?? state.workPackages ?? [])
    const requested =
      partial.calculatorTypeId !== undefined ? partial.calculatorTypeId : state.calculatorTypeId
    const calculatorTypeId = workPackages.some((pack) => pack.workTypeId === requested)
      ? requested
      : workPackages[0]?.workTypeId || null
    onStatePatch({
      ...partial,
      workPackages,
      calculatorTypeId,
      selectedFeatureIds: flattenWorkFeatureIds(workPackages),
    })
  }

  const pickObject = (id: string) => {
    if (!id) {
      patchDerived({
        objectTypeId: null,
        projectTypeId: null,
        workPackages: [],
        calculatorTypeId: null,
      })
      return
    }
    const objectId = id as EstimatorObjectTypeId
    const object = ESTIMATOR_OBJECT_TYPES.find((item) => item.id === objectId)
    const workPackages = packagesFromRecommended(objectId)
    patchDerived({
      objectTypeId: objectId,
      projectTypeId: object?.engineType || 'other',
      workPackages,
      calculatorTypeId: workPackages[0]?.workTypeId || null,
    })
  }

  const addWork = (slug: string) => {
    if (!slug) return
    patchDerived({
      workPackages: addWorkPackage(packages, slug),
      calculatorTypeId: slug,
    })
    setWorkToAdd('')
  }

  const removeWork = (slug: string) => {
    const workPackages = packages.filter((pack) => pack.workTypeId !== slug)
    patchDerived({
      workPackages,
      calculatorTypeId: workPackages[0]?.workTypeId || null,
    })
  }

  const toggleFeature = (id: string) => {
    if (!activePack) return
    const selected = new Set(activePack.selectedFeatureIds)
    if (selected.has(id)) selected.delete(id)
    else selected.add(id)
    patchDerived({
      calculatorTypeId: activePack.workTypeId,
      workPackages: packages.map((pack) =>
        pack.workTypeId === activePack.workTypeId
          ? { ...pack, selectedFeatureIds: [...selected] }
          : pack,
      ),
    })
  }

  const availableToAdd = WORK_SLUGS.filter((slug) => !packages.some((pack) => pack.workTypeId === slug))
  const groupedLines = preview.lines.reduce<Record<string, typeof preview.lines>>((acc, line) => {
    const key = line.workTypeId || 'other'
    acc[key] = acc[key] || []
    acc[key].push(line)
    return acc
  }, {})

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
              value={state.objectTypeId || ''}
              onChange={(e) => pickObject(e.target.value)}
            >
              <option value="">{t('costEstimator.calc.selectType')}</option>
              {ESTIMATOR_OBJECT_TYPES.map((item) => (
                <option key={item.id} value={item.id}>
                  {objectTypeLabel(item.id, lang)}
                </option>
              ))}
            </select>
          </label>
          <label className="estimator-calc__label" htmlFor="estimator-work-type">
            {t('costEstimator.calc.workType')}
            <span className="estimator-calc__add-row">
              <select
                id="estimator-work-type"
                className="estimator-calc__input"
                value={workToAdd}
                disabled={!state.objectTypeId}
                onChange={(e) => setWorkToAdd(e.target.value)}
              >
                <option value="">{t('costEstimator.calc.selectWork')}</option>
                {availableToAdd.map((slug) => (
                  <option key={slug} value={slug}>
                    {workTypeLabel(slug, lang)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="estimator-calc__add-work"
                disabled={!state.objectTypeId || !workToAdd}
                onClick={() => addWork(workToAdd)}
              >
                <Plus className="h-4 w-4" aria-hidden />
                {t('costEstimator.calc.addWork')}
              </button>
            </span>
          </label>
          {packages.length > 0 ? (
            <ol className="estimator-calc__works">
              {packages.map((pack, index) => {
                const active = pack.workTypeId === activePack?.workTypeId
                return (
                  <li key={pack.workTypeId}>
                    <button
                      type="button"
                      className={active ? 'estimator-calc__work is-active' : 'estimator-calc__work'}
                      onClick={() => patchDerived({ calculatorTypeId: pack.workTypeId })}
                    >
                      <span className="estimator-calc__work-n">{index + 1}</span>
                      <span>{workTypeLabel(pack.workTypeId, lang)}</span>
                      <span className="estimator-calc__work-count">{pack.selectedFeatureIds.length}</span>
                    </button>
                    <button
                      type="button"
                      className="estimator-calc__remove"
                      aria-label={t('costEstimator.calc.removeWork')}
                      onClick={() => removeWork(pack.workTypeId)}
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </li>
                )
              })}
            </ol>
          ) : null}
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
            {activePack
              ? `${t('costEstimator.calc.features')} — ${workTypeLabel(activePack.workTypeId, lang)}`
              : t('costEstimator.calc.features')}
          </h2>
          {!state.objectTypeId ? (
            <p className="estimator-calc__empty">{t('costEstimator.calc.pickObjectFirst')}</p>
          ) : !activePack ? (
            <p className="estimator-calc__empty">{t('costEstimator.calc.pickWorkFirst')}</p>
          ) : (
            <ul className="estimator-calc__features">
              {features.map((item) => {
                const checked = activePack.selectedFeatureIds.includes(item.id)
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
          <p className="estimator-calc__project">{objectLabel}</p>
          <ul className="estimator-calc__picked">
            {preview.lines.length === 0 ? (
              <li className="estimator-calc__empty">{t('costEstimator.calc.dropFeatures')}</li>
            ) : (
              Object.entries(groupedLines).map(([workTypeId, lines]) => (
                <li key={workTypeId} className="estimator-calc__picked-group">
                  <p className="estimator-calc__picked-work">{workTypeLabel(workTypeId, lang)}</p>
                  <ul>
                    {lines.map((line) => (
                      <li key={line.id}>
                        <span>{line.label}</span>
                        <span className="tabular-nums">{formatEuro(line.amount)}</span>
                        <button
                          type="button"
                          className="estimator-calc__remove"
                          aria-label={t('costEstimator.delete')}
                          onClick={() => {
                            patchDerived({
                              calculatorTypeId: workTypeId,
                              workPackages: packages.map((row) =>
                                row.workTypeId === workTypeId
                                  ? {
                                      ...row,
                                      selectedFeatureIds: row.selectedFeatureIds.filter(
                                        (fid) => fid !== line.id,
                                      ),
                                    }
                                  : row,
                              ),
                            })
                          }}
                        >
                          <X className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
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
