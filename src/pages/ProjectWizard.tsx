import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import {
  applyBudgetBand,
  EMPTY_WIZARD_STATE,
  PROJECT_TRADES,
  validateWizardStep,
  type ProjectWizardState,
  type WizardBudgetBand,
  type WizardFieldErrors,
} from '../lib/projectWizard'
import {
  saveProjectWizardDraftListing,
  submitProjectWizard,
} from '../lib/submitProjectWizard'
import {
  clearWizardDraftLocal,
  loadLatestWizardDraftRemote,
  loadWizardDraftLocal,
  pushRecentTrade,
  saveWizardDraftLocal,
  upsertWizardDraftRemote,
} from '../lib/wizardDrafts'
import { WizardShell } from '../components/project-wizard/WizardShell'
import { CategoryStep } from '../components/project-wizard/CategoryStep'
import { DescriptionStep } from '../components/project-wizard/DescriptionStep'
import { UploadStep } from '../components/project-wizard/UploadStep'
import { BudgetStep } from '../components/project-wizard/BudgetStep'
import { DeadlineStep } from '../components/project-wizard/DeadlineStep'
import { PreferencesStep } from '../components/project-wizard/PreferencesStep'
import { PreviewStep } from '../components/project-wizard/PreviewStep'
import { SuccessStep } from '../components/project-wizard/SuccessStep'
import type { TranslationKey } from '../lib/i18n'

const LocationStep = lazy(() =>
  import('../components/project-wizard/LocationStep').then((m) => ({ default: m.LocationStep })),
)

function StepSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      <div className="h-12 animate-pulse rounded-[14px] bg-[#f0f0f2]" />
      <div className="h-56 animate-pulse rounded-[18px] bg-[#f0f0f2]" />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-12 animate-pulse rounded-[14px] bg-[#f0f0f2]" />
        <div className="h-12 animate-pulse rounded-[14px] bg-[#f0f0f2]" />
        <div className="h-12 animate-pulse rounded-[14px] bg-[#f0f0f2]" />
      </div>
    </div>
  )
}

function tw(t: (k: TranslationKey) => string, key: string, fallback: string): string {
  try {
    const v = t(key as TranslationKey)
    if (!v || v === key) return fallback
    return v
  } catch {
    return fallback
  }
}

/** Customer Project Wizard — /create-project (alias /project/new) */
export function ProjectWizard() {
  const { user, profile, language, t } = useApp()
  const [state, setState] = useState<ProjectWizardState>(EMPTY_WIZARD_STATE)
  const [busy, setBusy] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<WizardFieldErrors>({})
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      let restored = loadWizardDraftLocal()
      if (user) {
        const remote = await loadLatestWizardDraftRemote(user.id)
        if (remote && (!restored || (remote.step || 1) >= (restored.step || 1))) {
          restored = remote
        }
      }
      if (cancelled) return
      if (restored && !restored.publishedId) {
        setState((s) => ({
          ...restored!,
          contactName: restored!.contactName || profile?.full_name || s.contactName,
          contactPhone: restored!.contactPhone || profile?.phone || s.contactPhone,
          contactEmail: restored!.contactEmail || user?.email || s.contactEmail,
          preferredLanguage:
            restored!.preferredLanguage || language.code || s.preferredLanguage,
          files: s.files,
        }))
      } else if (profile || user) {
        setState((s) => ({
          ...s,
          contactName: s.contactName || profile?.full_name || '',
          contactPhone: s.contactPhone || profile?.phone || '',
          contactEmail: s.contactEmail || user?.email || '',
          preferredLanguage: s.preferredLanguage || language.code || 'en',
        }))
      }
      setHydrated(true)
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const patch = (p: Partial<ProjectWizardState>) => {
    setState((s) => ({ ...s, ...p }))
    setFieldErrors({})
    setError(null)
  }

  const trade = PROJECT_TRADES.find((x) => x.id === state.tradeId)
  const tradeLabel = trade
    ? tw(t, trade.labelKey, trade.labelEn)
    : tw(t, 'project.wizard.category', 'Category')

  const persistDraft = useCallback(
    async (current: ProjectWizardState, showBusy: boolean) => {
      if (!user || current.step >= 9) return
      if (showBusy) setSavingDraft(true)
      saveWizardDraftLocal(current)
      const remote = await upsertWizardDraftRemote(user.id, current)
      let next = current
      if ('draftId' in remote) {
        next = { ...current, draftId: remote.draftId }
        if (remote.draftId !== current.draftId) {
          setState((s) => ({ ...s, draftId: remote.draftId }))
        }
      }
      const listing = await saveProjectWizardDraftListing(user.id, next, tradeLabel)
      if ('listingId' in listing && listing.listingId !== current.listingId) {
        setState((s) => ({ ...s, listingId: listing.listingId }))
      }
      setDraftSavedAt(
        new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
      )
      if (showBusy) setSavingDraft(false)
    },
    [user, tradeLabel],
  )

  useEffect(() => {
    if (!hydrated || state.step >= 9) return
    saveWizardDraftLocal(state)
  }, [state, hydrated])

  // Autosave every 10 seconds
  useEffect(() => {
    if (!hydrated || !user || state.step >= 9) return
    const id = window.setInterval(() => {
      void persistDraft(stateRef.current, false)
    }, 10000)
    return () => window.clearInterval(id)
  }, [hydrated, user, state.step, persistDraft])

  const titles: Record<number, { title: string; subtitle: string }> = {
    1: {
      title: tw(t, 'project.wizard.step1.title', 'What service do you need?'),
      subtitle: tw(t, 'project.wizard.step1.sub', 'Search or pick a popular category'),
    },
    2: {
      title: tw(t, 'project.wizard.step2.title', 'Describe your project'),
      subtitle: tw(t, 'project.wizard.step2.sub', 'Share goals, size, and details'),
    },
    3: {
      title: tw(t, 'project.wizard.step3.title', 'Upload files'),
      subtitle: tw(t, 'project.wizard.step3.sub', 'Photos, videos, PDF, plans — optional'),
    },
    4: {
      title: tw(t, 'project.wizard.step4.title', 'Where is the work?'),
      subtitle: tw(t, 'project.wizard.step4.sub', 'Country, city, postal code, map'),
    },
    5: {
      title: tw(t, 'project.wizard.step5.title', 'Budget'),
      subtitle: tw(t, 'project.wizard.step5.sub', 'Choose a range that fits'),
    },
    6: {
      title: tw(t, 'project.wizard.step6.title', 'Timeline'),
      subtitle: tw(t, 'project.wizard.step6.sub', 'When should work start?'),
    },
    7: {
      title: tw(t, 'project.wizard.step7.title', 'Additional preferences'),
      subtitle: tw(t, 'project.wizard.step7.sub', 'Optional filters for matching'),
    },
    8: {
      title: tw(t, 'project.wizard.step8.title', 'Preview'),
      subtitle: tw(t, 'project.wizard.step8.sub', 'Review and edit any section'),
    },
    9: {
      title: tw(t, 'project.wizard.step9.title', 'Published'),
      subtitle: tw(t, 'project.wizard.step9.sub', 'Your project is live'),
    },
  }

  const goNext = () => {
    const errs = validateWizardStep(state.step, state)
    if (Object.keys(errs).length) {
      setFieldErrors(errs)
      setError(Object.values(errs)[0] || 'Please fix the highlighted fields')
      return
    }
    if (state.step === 1 && state.tradeId) pushRecentTrade(state.tradeId)
    if (state.step < 8) {
      patch({ step: state.step + 1 })
      return
    }
    if (state.step === 8) {
      void submit()
    }
  }

  const submit = async () => {
    if (!user) {
      navigateTo('/login')
      return
    }
    const errs = validateWizardStep(8, state)
    if (Object.keys(errs).length) {
      setFieldErrors(errs)
      setError(Object.values(errs)[0] || null)
      return
    }
    setBusy(true)
    setError(null)
    const result = await submitProjectWizard(user.id, state, tradeLabel)
    setBusy(false)
    if ('error' in result) {
      setError(result.error === 'incomplete' ? 'Please complete all required fields' : result.error)
      return
    }
    clearWizardDraftLocal()
    patch({ step: 9, publishedId: result.listingId, listingId: result.listingId })
  }

  if (!user) {
    return (
      <div className="create-project-page flex min-h-[60vh] flex-col items-center justify-center bg-[#f5f5f7] px-4 text-center">
        <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-[#1d1d1f]">
          {tw(t, 'project.wizard.loginTitle', 'Sign in to create a project')}
        </h1>
        <p className="mt-2 max-w-sm text-[15px] text-[#6e6e73]">
          Post in under 2 minutes. Matched with verified professionals near you.
        </p>
        <button
          type="button"
          className="mt-6 rounded-full bg-[#1d1d1f] px-7 py-3 text-[15px] font-semibold text-white"
          onClick={() => navigateTo('/login')}
        >
          {tw(t, 'header.signIn', 'Sign in')}
        </button>
      </div>
    )
  }

  if (!hydrated) {
    return (
      <div className="create-project-page flex min-h-[50vh] items-center justify-center bg-[#f5f5f7]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#d2d2d7] border-t-[#1d1d1f]" />
      </div>
    )
  }

  const meta = titles[state.step]

  return (
    <WizardShell
      step={state.step}
      title={meta.title}
      subtitle={meta.subtitle}
      backLabel={tw(t, 'common.back', 'Back')}
      nextLabel={
        state.step === 8
          ? tw(t, 'project.wizard.publish', 'Publish project')
          : tw(t, 'common.continue', 'Continue')
      }
      saveDraftLabel={tw(t, 'project.wizard.saveDraft', 'Save draft')}
      nextDisabled={busy}
      busy={busy}
      savingDraft={savingDraft}
      error={error}
      draftSavedAt={draftSavedAt}
      hideFooter={state.step === 9}
      onBack={
        state.step > 1 && state.step < 9 ? () => patch({ step: state.step - 1 }) : undefined
      }
      onNext={state.step < 9 ? goNext : undefined}
      onSaveDraft={
        state.step < 9
          ? () => {
              void persistDraft(state, true)
            }
          : undefined
      }
    >
      {state.step === 1 && (
        <CategoryStep
          selectedId={state.tradeId}
          query={state.categoryQuery}
          descriptionHint={state.description}
          onQueryChange={(categoryQuery) => patch({ categoryQuery })}
          onSelect={(tradeId, subcategorySlug) => patch({ tradeId, subcategorySlug })}
          t={(key) => tw(t, key, PROJECT_TRADES.find((x) => x.labelKey === key)?.labelEn || key)}
          error={fieldErrors.tradeId}
          labels={{
            search: tw(t, 'project.wizard.searchCategory', 'Search services…'),
            popular: tw(t, 'project.wizard.popular', 'Popular categories'),
            ai: tw(t, 'project.wizard.aiSuggestions', 'AI suggestions'),
            recent: tw(t, 'project.wizard.recent', 'Recently used'),
            all: tw(t, 'project.wizard.allServices', 'All services'),
          }}
        />
      )}
      {state.step === 2 && (
        <DescriptionStep
          value={state.description}
          onChange={(description) => patch({ description })}
          tradeId={state.tradeId}
          city={state.city}
          language={state.preferredLanguage}
          placeholder={tw(
            t,
            'project.wizard.descPlaceholder',
            'I need to paint a 120m² apartment…',
          )}
          hint={tw(t, 'project.wizard.descHint', 'At least 20 characters')}
          aiLabel={tw(t, 'project.wizard.aiHelp', 'Help me write my project')}
          error={fieldErrors.description}
        />
      )}
      {state.step === 3 && (
        <UploadStep
          files={state.files}
          onChange={(files) => patch({ files })}
          dropLabel={tw(t, 'project.wizard.drop', 'Drag & drop or click to upload')}
          help={tw(t, 'project.wizard.dropHelp', 'Photos, videos, PDF, plans — up to 12 files')}
        />
      )}
      {state.step === 4 && (
        <Suspense fallback={<StepSkeleton />}>
          <LocationStep
            country={state.country}
            city={state.city}
            postalCode={state.postalCode}
            locationLabel={state.locationLabel}
            latitude={state.latitude}
            longitude={state.longitude}
            onChange={patch}
            labels={{
              country: tw(t, 'project.wizard.country', 'Country'),
              city: tw(t, 'project.wizard.city', 'City'),
              postal: tw(t, 'project.wizard.postal', 'Postal code'),
              search: tw(t, 'project.wizard.locationSearch', 'Search address'),
              current: tw(t, 'project.wizard.useCurrent', 'Use current location'),
              map: tw(t, 'project.wizard.mapPicker', 'Map picker'),
            }}
            errors={{
              country: fieldErrors.country,
              city: fieldErrors.city,
              postalCode: fieldErrors.postalCode,
            }}
          />
        </Suspense>
      )}
      {state.step === 5 && (
        <BudgetStep
          budgetBand={state.budgetBand}
          budgetMin={state.budgetMin}
          budgetMax={state.budgetMax}
          onBandChange={(band: WizardBudgetBand) => patch(applyBudgetBand(band, state))}
          onCustomChange={(budgetMin, budgetMax) =>
            patch({ budgetBand: 'custom', budgetMin, budgetMax })
          }
          labels={{
            min: tw(t, 'project.wizard.budgetMin', 'Minimum €'),
            max: tw(t, 'project.wizard.budgetMax', 'Maximum €'),
            range: tw(t, 'project.wizard.budgetRange', 'Your estimated budget'),
            custom: tw(t, 'project.wizard.budgetCustom', 'Custom budget'),
          }}
          errors={{
            budgetMin: fieldErrors.budgetMin,
            budgetMax: fieldErrors.budgetMax,
          }}
        />
      )}
      {state.step === 6 && (
        <DeadlineStep
          deadlineType={state.deadlineType}
          deadlineAt={state.deadlineAt}
          urgency={state.urgency}
          onChange={patch}
          labels={{
            asap: tw(t, 'project.wizard.asap', 'ASAP'),
            thisWeek: tw(t, 'project.wizard.thisWeek', 'This week'),
            thisMonth: tw(t, 'project.wizard.thisMonth', 'This month'),
            flexible: tw(t, 'project.wizard.flexible', 'Flexible'),
            date: tw(t, 'project.wizard.specificDate', 'Choose date'),
            pickDate: tw(t, 'project.wizard.pickDate', 'Pick a date'),
          }}
          error={fieldErrors.deadlineAt}
        />
      )}
      {state.step === 7 && (
        <PreferencesStep
          preferences={state.preferences}
          onChange={(preferences) => patch({ preferences })}
          labels={{
            verifiedOnly: tw(t, 'project.wizard.prefVerified', 'Verified professionals only'),
            companiesOnly: tw(t, 'project.wizard.prefCompanies', 'Companies only'),
            emergency: tw(t, 'project.wizard.prefEmergency', 'Emergency'),
            premiumOnly: tw(t, 'project.wizard.prefPremium', 'Premium professionals'),
            insuranceRequired: tw(t, 'project.wizard.prefInsurance', 'Insurance required'),
            warrantyRequired: tw(t, 'project.wizard.prefWarranty', 'Warranty required'),
            hint: tw(
              t,
              'project.wizard.prefHint',
              'Optional — helps us match the right pros',
            ),
          }}
        />
      )}
      {state.step === 8 && (
        <PreviewStep
          state={state}
          tradeLabel={tradeLabel}
          onChange={patch}
          onEditStep={(step) => patch({ step })}
          errors={fieldErrors}
          labels={{
            category: tw(t, 'project.wizard.category', 'Category'),
            description: tw(t, 'project.wizard.description', 'Description'),
            media: tw(t, 'project.wizard.media', 'Media'),
            location: tw(t, 'project.wizard.location', 'Location'),
            budget: tw(t, 'project.wizard.budget', 'Budget'),
            deadline: tw(t, 'project.wizard.deadline', 'Timeline'),
            preferences: tw(t, 'project.wizard.preferences', 'Preferences'),
            contact: tw(t, 'project.wizard.contact', 'Contact'),
            name: tw(t, 'project.wizard.name', 'Name'),
            phone: tw(t, 'project.wizard.phone', 'Phone'),
            email: tw(t, 'project.wizard.email', 'Email'),
            files: tw(t, 'project.wizard.files', 'files'),
            edit: tw(t, 'common.edit', 'Edit'),
            asap: tw(t, 'project.wizard.asap', 'ASAP'),
            thisWeek: tw(t, 'project.wizard.thisWeek', 'This week'),
            thisMonth: tw(t, 'project.wizard.thisMonth', 'This month'),
            flexible: tw(t, 'project.wizard.flexible', 'Flexible'),
            date: tw(t, 'project.wizard.specificDate', 'Date'),
            prefVerified: tw(t, 'project.wizard.prefVerified', 'Verified professionals only'),
            prefCompanies: tw(t, 'project.wizard.prefCompanies', 'Companies only'),
            prefEmergency: tw(t, 'project.wizard.prefEmergency', 'Emergency'),
            prefPremium: tw(t, 'project.wizard.prefPremium', 'Premium professionals'),
            prefInsurance: tw(t, 'project.wizard.prefInsurance', 'Insurance required'),
            prefWarranty: tw(t, 'project.wizard.prefWarranty', 'Warranty required'),
          }}
        />
      )}
      {state.step === 9 && state.publishedId && (
        <SuccessStep
          projectId={state.publishedId}
          labels={{
            title: tw(t, 'project.wizard.successTitle', 'Project published!'),
            subtitle: tw(
              t,
              'project.wizard.successSub',
              'Professionals are being matched to your request.',
            ),
            projectId: tw(t, 'project.wizard.projectId', 'Project ID'),
            share: tw(t, 'project.wizard.share', 'Share project'),
            copied: tw(t, 'project.wizard.copied', 'Copied'),
            track: tw(t, 'project.wizard.track', 'Track status'),
            matches: tw(t, 'project.wizard.viewMatches', 'View matching professionals'),
            matchingTitle: tw(t, 'project.wizard.matchingTitle', 'Matching professionals'),
            invite: tw(t, 'project.wizard.invite', 'Invite'),
            invited: tw(t, 'project.wizard.invited', 'Invited'),
            matchingEmpty: tw(
              t,
              'project.wizard.matchingEmpty',
              'Matches are being prepared — check back in a moment.',
            ),
          }}
          onTrack={() => navigateTo('/my-projects')}
          onMatches={() => navigateTo(`/project/${state.publishedId}/matches`)}
        />
      )}
    </WizardShell>
  )
}

export { ProjectWizard as CreateProject }
