import { useApp } from '../../contexts/AppContext'
import type { EstimatorProjectTypeId } from '../../lib/costEstimatorTypes'
import { ESTIMATOR_PROJECT_TYPES } from '../../lib/costEstimatorTypes'
import {
  BZ_BID_COUNTS,
  BZ_POPULAR_PROJECTS,
  BZ_PROPERTY_TYPES,
  BZ_QUOTE_SCREENS,
  BZ_URGENCY_OPTIONS,
  type BzQuoteDraft,
  type BzQuoteScreen,
} from '../../lib/buildzoomQuoteFlow'

type EstimatorQuoteWizardProps = {
  draft: BzQuoteDraft
  screen: BzQuoteScreen
  onTitleChange: (value: string) => void
  onSelectPopular: (id: EstimatorProjectTypeId, label: string) => void
  onContinueTitle: () => void
  onSelectUrgency: (id: BzQuoteDraft['urgency']) => void
  onSelectBids: (n: NonNullable<BzQuoteDraft['bids']>) => void
  onSelectProperty: (id: NonNullable<BzQuoteDraft['propertyType']>) => void
  onBack: () => void
}

export function EstimatorQuoteWizard({
  draft,
  screen,
  onTitleChange,
  onSelectPopular,
  onContinueTitle,
  onSelectUrgency,
  onSelectBids,
  onSelectProperty,
  onBack,
}: EstimatorQuoteWizardProps) {
  const { t } = useApp()
  const stepIndex = BZ_QUOTE_SCREENS.indexOf(screen)
  const pct = Math.round(((stepIndex + 1) / BZ_QUOTE_SCREENS.length) * 100)

  return (
    <div className="bz-quote">
      <div className="bz-quote__nav">
        <button type="button" className="bz-quote__back" onClick={onBack}>
          ←
        </button>
        <div className="bz-quote__progress" aria-hidden>
          <div className="bz-quote__progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {screen === 'title' ? (
        <div className="bz-quote__title-screen">
          <p className="bz-quote__slogan">{t('costEstimator.quote.slogan')}</p>
          <h2 className="bz-quote__question">{t('costEstimator.quote.question')}</h2>
          <input
            id="bz-quote-title"
            className="bz-quote__input"
            value={draft.title}
            autoComplete="off"
            placeholder={t('costEstimator.quote.placeholder')}
            onChange={(e) => onTitleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onContinueTitle()
              }
            }}
          />
          <button type="button" className="bz-quote__continue" onClick={onContinueTitle}>
            {t('costEstimator.quote.continue')}
          </button>
          <p className="bz-quote__popular-label">{t('costEstimator.quote.popular')}</p>
          <ul className="bz-quote__popular">
            {BZ_POPULAR_PROJECTS.map((card) => {
              const Icon = ESTIMATOR_PROJECT_TYPES.find((pt) => pt.id === card.id)?.icon
              const label = t(card.labelKey as never)
              const active = draft.typeId === card.id
              return (
                <li key={card.id}>
                  <button
                    type="button"
                    className={active ? 'bz-quote__tile is-active' : 'bz-quote__tile'}
                    onClick={() => onSelectPopular(card.id, label)}
                  >
                    {Icon ? (
                      <span className="bz-quote__tile-icon" aria-hidden>
                        <Icon className="h-7 w-7" strokeWidth={1.35} />
                      </span>
                    ) : null}
                    <span>{label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      {screen === 'urgency' ? (
        <div className="bz-quote__survey">
          <h2 className="bz-quote__question">{t('costEstimator.quote.urgencyTitle')}</h2>
          <div className="bz-quote__answers">
            {BZ_URGENCY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={
                  draft.urgency === opt.id ? 'bz-quote__answer is-active' : 'bz-quote__answer'
                }
                onClick={() => onSelectUrgency(opt.id)}
              >
                {t(opt.labelKey)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {screen === 'bids' ? (
        <div className="bz-quote__survey">
          <h2 className="bz-quote__question">{t('costEstimator.quote.bidsTitle')}</h2>
          <div className="bz-quote__answers">
            {BZ_BID_COUNTS.map((n) => (
              <button
                key={n}
                type="button"
                className={draft.bids === n ? 'bz-quote__answer is-active' : 'bz-quote__answer'}
                onClick={() => onSelectBids(n)}
              >
                {n}
                {n === 4 ? (
                  <span className="bz-quote__answer-sub">{t('costEstimator.quote.bidsRecommended')}</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {screen === 'property' ? (
        <div className="bz-quote__survey">
          <h2 className="bz-quote__question">{t('costEstimator.quote.propertyTitle')}</h2>
          <ul className="bz-quote__popular bz-quote__popular--property">
            {BZ_PROPERTY_TYPES.map((opt) => {
              const active = draft.propertyType === opt.id
              return (
                <li key={opt.id}>
                  <button
                    type="button"
                    className={active ? 'bz-quote__tile is-active' : 'bz-quote__tile'}
                    onClick={() => onSelectProperty(opt.id)}
                  >
                    <span>{t(opt.labelKey)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
