import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useApp } from '../../contexts/AppContext'
import type { EstimatorDraftFile, EstimatorProjectTypeId } from '../../lib/costEstimatorTypes'
import { ESTIMATOR_PROJECT_TYPES } from '../../lib/costEstimatorTypes'
import { autocompleteLocations, resolveLocationDetails } from '../../lib/locationAutocomplete'
import type { LocationSuggestion } from '../../lib/geocoding'
import {
  BZ_BUDGET_OPTIONS,
  BZ_DESIGN_OPTIONS,
  BZ_LAND_OPTIONS,
  BZ_LOADING_STEPS,
  BZ_POPULAR_PROJECTS,
  BZ_PROPERTY_TYPES,
  BZ_RELATIONSHIP_OPTIONS,
  BZ_URGENCY_OPTIONS,
  isLowBudget,
  progressPercent,
  screensForQuoteType,
  type BzAuthContext,
  type BzQuoteDraft,
  type BzQuoteScreen,
} from '../../lib/buildzoomQuoteFlow'

type EstimatorQuoteWizardProps = {
  draft: BzQuoteDraft
  screen: BzQuoteScreen
  auth: BzAuthContext
  fieldError: string | null
  files: EstimatorDraftFile[]
  onTitleChange: (value: string) => void
  onSelectPopular: (id: EstimatorProjectTypeId, label: string) => void
  onContinueTitle: () => void
  onSelectUrgency: (id: NonNullable<BzQuoteDraft['urgency']>) => void
  onSelectLand: (id: NonNullable<BzQuoteDraft['land']>) => void
  onSelectProperty: (id: NonNullable<BzQuoteDraft['propertyType']>) => void
  onSelectRelationship: (id: NonNullable<BzQuoteDraft['relationship']>) => void
  onSelectDesign: (id: NonNullable<BzQuoteDraft['designStatus']>) => void
  onPatch: (patch: Partial<BzQuoteDraft>) => void
  onContinue: () => void
  onSubmitPassword: (password: string) => void
  onAttachFiles: (files: FileList) => void
  onRemoveFile: (id: string) => void
  onBack: () => void
  onClose: () => void
  onForward?: () => void
  canForward?: boolean
  onLoadingComplete: () => void
}

function SurveyButtons({
  options,
  value,
  onSelect,
}: {
  options: Array<{ id: string; labelKey: string; subKey?: string }>
  value: string | null
  onSelect: (id: string) => void
}) {
  const { t } = useApp()
  return (
    <div className="bz-quote__answers">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={value === opt.id ? 'bz-quote__answer is-active' : 'bz-quote__answer'}
          onClick={() => onSelect(opt.id)}
        >
          {t(opt.labelKey as never)}
          {opt.subKey ? <span className="bz-quote__answer-sub">{t(opt.subKey as never)}</span> : null}
        </button>
      ))}
    </div>
  )
}

function ContinueButton({
  label,
  disabled,
  onClick,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button type="button" className="bz-quote__continue" disabled={disabled} onClick={onClick}>
      {label}
    </button>
  )
}

function FieldError({ message }: { message: string | null }) {
  if (!message) return null
  return <p className="bz-quote__error">{message}</p>
}

export function EstimatorQuoteWizard({
  draft,
  screen,
  auth,
  fieldError,
  files,
  onTitleChange,
  onSelectPopular,
  onContinueTitle,
  onSelectUrgency,
  onSelectLand,
  onSelectProperty,
  onSelectRelationship,
  onSelectDesign,
  onPatch,
  onContinue,
  onSubmitPassword,
  onAttachFiles,
  onRemoveFile,
  onBack,
  onClose,
  onForward,
  canForward,
  onLoadingComplete,
}: EstimatorQuoteWizardProps) {
  const { t } = useApp()
  const screens = screensForQuoteType(draft.typeId, auth)
  const pct = progressPercent(screen, draft.typeId, auth)
  const fileRef = useRef<HTMLInputElement>(null)
  const [password, setPassword] = useState('')
  const [citySuggestions, setCitySuggestions] = useState<LocationSuggestion[]>([])
  const [loadingStep, setLoadingStep] = useState(0)
  const loadingCompleteRef = useRef(onLoadingComplete)
  loadingCompleteRef.current = onLoadingComplete

  useEffect(() => {
    if (screen !== 'loading') {
      setLoadingStep(0)
      return
    }
    let cancelled = false
    let step = 0
    const tick = () => {
      if (cancelled) return
      const wait = BZ_LOADING_STEPS[step].durationMs
      window.setTimeout(() => {
        if (cancelled) return
        if (step >= BZ_LOADING_STEPS.length - 1) {
          loadingCompleteRef.current()
          return
        }
        step += 1
        setLoadingStep(step)
        tick()
      }, wait)
    }
    tick()
    return () => {
      cancelled = true
    }
  }, [screen])

  useEffect(() => {
    const q = draft.city.trim() || draft.locationLabel.trim()
    if (screen !== 'location' || q.length < 2) {
      setCitySuggestions([])
      return
    }
    const timer = window.setTimeout(() => {
      void autocompleteLocations(q).then((list) => setCitySuggestions(list.slice(0, 6)))
    }, 280)
    return () => window.clearTimeout(timer)
  }, [draft.city, draft.locationLabel, screen])

  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  const continueLabel = t('costEstimator.quote.continue')
  const isFirst = screen === 'title'

  return createPortal(
    <div className="bz-quote-overlay">
      <div className="bz-quote-overlay__scrim" onClick={onClose} aria-hidden />
      <div className="bz-quote" data-quote-screen={screen} role="dialog" aria-modal="true">
      {!isFirst ? (
        <div className="bz-quote__progress" aria-hidden>
          <div className="bz-quote__progress-fill" style={{ width: `${pct}%` }} />
        </div>
      ) : (
        <div className="bz-quote__progress bz-quote__progress--hidden" aria-hidden />
      )}
      <div className="bz-quote__nav">
        {isFirst ? (
          <span className="bz-quote__nav-spacer" />
        ) : (
          <button type="button" className="bz-quote__back" onClick={onBack} aria-label={t('common.back')}>
            ‹
          </button>
        )}
        {canForward && onForward && !isFirst ? (
          <button type="button" className="bz-quote__forward" onClick={onForward} aria-label={t('common.continue')}>
            ›
          </button>
        ) : (
          <span className="bz-quote__nav-spacer" />
        )}
        <button type="button" className="bz-quote__close" onClick={onClose} aria-label={t('common.close')}>
          ×
        </button>
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
          <FieldError message={fieldError} />
          <ContinueButton label={continueLabel} onClick={onContinueTitle} />
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
          <SurveyButtons
            options={BZ_URGENCY_OPTIONS.map((o) => ({ id: o.id, labelKey: o.labelKey }))}
            value={draft.urgency}
            onSelect={(id) => onSelectUrgency(id as NonNullable<BzQuoteDraft['urgency']>)}
          />
        </div>
      ) : null}

      {screen === 'land' ? (
        <div className="bz-quote__survey">
          <h2 className="bz-quote__question">{t('costEstimator.quote.landTitle')}</h2>
          <SurveyButtons
            options={BZ_LAND_OPTIONS.map((o) => ({ id: o.id, labelKey: o.labelKey }))}
            value={draft.land}
            onSelect={(id) => onSelectLand(id as NonNullable<BzQuoteDraft['land']>)}
          />
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

      {screen === 'email' ? (
        <div className="bz-quote__survey">
          <h2 className="bz-quote__question">{t('costEstimator.quote.emailTitle')}</h2>
          <input
            className="bz-quote__input"
            type="email"
            autoComplete="email"
            placeholder={t('costEstimator.quote.emailPlaceholder')}
            value={draft.email}
            onChange={(e) => onPatch({ email: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onContinue()
              }
            }}
          />
          <FieldError message={fieldError} />
          <ContinueButton label={continueLabel} onClick={onContinue} />
        </div>
      ) : null}

      {screen === 'phone' ? (
        <div className="bz-quote__survey">
          <h2 className="bz-quote__question">{t('costEstimator.quote.phoneTitle')}</h2>
          <input
            className="bz-quote__input"
            type="tel"
            autoComplete="tel"
            placeholder={t('costEstimator.quote.phonePlaceholder')}
            value={draft.phone}
            onChange={(e) => onPatch({ phone: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onContinue()
              }
            }}
          />
          <FieldError message={fieldError} />
          <ContinueButton label={continueLabel} onClick={onContinue} />
        </div>
      ) : null}

      {screen === 'name' ? (
        <div className="bz-quote__survey">
          <h2 className="bz-quote__question">{t('costEstimator.quote.nameTitle')}</h2>
          <input
            className="bz-quote__input"
            type="text"
            autoComplete="name"
            placeholder={t('costEstimator.quote.namePlaceholder')}
            value={draft.name}
            onChange={(e) => onPatch({ name: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onContinue()
              }
            }}
          />
          <FieldError message={fieldError} />
          <ContinueButton label={continueLabel} onClick={onContinue} />
        </div>
      ) : null}

      {screen === 'location' ? (
        <div className="bz-quote__survey">
          <h2 className="bz-quote__question">{t('costEstimator.quote.locationTitle')}</h2>
          <div className="bz-quote__location">
            <input
              className="bz-quote__input"
              autoComplete="street-address"
              placeholder={t('costEstimator.quote.streetPlaceholder')}
              value={draft.street}
              onChange={(e) => onPatch({ street: e.target.value, locationLabel: e.target.value })}
            />
            <div className="bz-quote__loc-row">
              <input
                className="bz-quote__input"
                autoComplete="address-level2"
                placeholder={t('costEstimator.quote.cityPlaceholder')}
                value={draft.city}
                onChange={(e) => onPatch({ city: e.target.value })}
              />
              <input
                className="bz-quote__input"
                autoComplete="postal-code"
                placeholder={t('costEstimator.quote.postalPlaceholder')}
                value={draft.postalCode}
                onChange={(e) => onPatch({ postalCode: e.target.value })}
              />
            </div>
            {citySuggestions.length > 0 ? (
              <ul className="bz-quote__suggest">
                {citySuggestions.map((s) => (
                  <li key={s.placeId || s.displayName}>
                    <button
                      type="button"
                      onClick={() => {
                        void resolveLocationDetails(s).then((detail) => {
                          onPatch({
                            locationLabel: detail.displayName,
                            street: draft.street || detail.displayName,
                            city: detail.name || draft.city,
                            country: detail.country || draft.country,
                            postalCode: detail.postalCode || draft.postalCode,
                            latitude: detail.lat ?? null,
                            longitude: detail.lon ?? null,
                          })
                          setCitySuggestions([])
                        })
                      }}
                    >
                      {s.displayName}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <FieldError message={fieldError} />
          <ContinueButton label={continueLabel} onClick={onContinue} />
        </div>
      ) : null}

      {screen === 'relationship' ? (
        <div className="bz-quote__survey">
          <h2 className="bz-quote__question">{t('costEstimator.quote.relationshipTitle')}</h2>
          <SurveyButtons
            options={BZ_RELATIONSHIP_OPTIONS.map((o) => ({ id: o.id, labelKey: o.labelKey }))}
            value={draft.relationship}
            onSelect={(id) => onSelectRelationship(id as NonNullable<BzQuoteDraft['relationship']>)}
          />
        </div>
      ) : null}

      {screen === 'design' ? (
        <div className="bz-quote__survey">
          <h2 className="bz-quote__question">{t('costEstimator.quote.designTitle')}</h2>
          <SurveyButtons
            options={BZ_DESIGN_OPTIONS.map((o) => ({ id: o.id, labelKey: o.labelKey }))}
            value={draft.designStatus}
            onSelect={(id) => onSelectDesign(id as NonNullable<BzQuoteDraft['designStatus']>)}
          />
        </div>
      ) : null}

      {screen === 'budget' ? (
        <div className="bz-quote__survey">
          <h2 className="bz-quote__question">{t('costEstimator.quote.budgetTitle')}</h2>
          <select
            className="bz-quote__input bz-quote__select"
            value={draft.budget ?? ''}
            onChange={(e) => onPatch({ budget: (e.target.value || null) as BzQuoteDraft['budget'] })}
          >
            {BZ_BUDGET_OPTIONS.map((opt) => (
              <option key={opt.id || 'placeholder'} value={opt.id} disabled={opt.id === ''}>
                {t(opt.labelKey)}
              </option>
            ))}
          </select>
          <label className="bz-quote__check">
            <input
              type="checkbox"
              checked={draft.financing}
              onChange={(e) => onPatch({ financing: e.target.checked })}
            />
            <span>{t('costEstimator.quote.financing')}</span>
          </label>
          <FieldError message={fieldError} />
          <ContinueButton
            label={continueLabel}
            disabled={isLowBudget(draft.budget)}
            onClick={onContinue}
          />
        </div>
      ) : null}

      {screen === 'description' ? (
        <div className="bz-quote__survey">
          <h2 className="bz-quote__question">{t('costEstimator.quote.descriptionTitle')}</h2>
          <textarea
            className="bz-quote__input bz-quote__textarea"
            rows={6}
            maxLength={7500}
            placeholder={t('costEstimator.quote.descriptionPlaceholder')}
            value={draft.description}
            onChange={(e) => onPatch({ description: e.target.value })}
          />
          <FieldError message={fieldError} />
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*,.pdf,.dwg,.dxf"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) onAttachFiles(e.target.files)
              e.target.value = ''
            }}
          />
          {files.length === 0 ? (
            <button type="button" className="bz-quote__attach" onClick={() => fileRef.current?.click()}>
              {t('costEstimator.quote.attach')}
            </button>
          ) : (
            <ul className="bz-quote__files">
              {files.map((f) => (
                <li key={f.id}>
                  <span>{f.file.name}</span>
                  <button type="button" onClick={() => onRemoveFile(f.id)}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
          <ContinueButton label={continueLabel} onClick={onContinue} />
        </div>
      ) : null}

      {screen === 'password' ? (
        <div className="bz-quote__survey">
          <h2 className="bz-quote__question">{t('costEstimator.quote.passwordTitle')}</h2>
          {draft.email ? (
            <p className="bz-quote__email-display">
              {draft.email}
              <span>{t('costEstimator.quote.passwordEmailHint')}</span>
            </p>
          ) : null}
          <input
            className="bz-quote__input"
            type="password"
            autoComplete="new-password"
            placeholder={t('costEstimator.quote.passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onSubmitPassword(password)
              }
            }}
          />
          <FieldError message={fieldError} />
          <ContinueButton
            label={t('costEstimator.quote.submit')}
            onClick={() => onSubmitPassword(password)}
          />
        </div>
      ) : null}

      {screen === 'loading' ? (
        <div className="bz-quote__loading">
          <p className="bz-quote__logo-mark">DImarket</p>
          <h2 className="bz-quote__question">
            {draft.city
              ? t('costEstimator.quote.loading.near').replace('{city}', draft.city)
              : t(BZ_LOADING_STEPS[loadingStep]?.labelKey ?? 'costEstimator.quote.loading.tools')}
          </h2>
          <ol className="bz-quote__timeline">
            {BZ_LOADING_STEPS.map((step, i) => (
              <li key={step.id} className={i <= loadingStep ? 'is-active' : undefined}>
                {t(step.labelKey)}
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {screen !== 'title' && screen !== 'loading' ? (
        <p className="bz-quote__step-index" hidden>
          {screens.indexOf(screen) + 1}/{screens.length}
        </p>
      ) : null}
      </div>
    </div>,
    document.body,
  )
}
