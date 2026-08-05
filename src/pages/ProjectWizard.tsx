import { useEffect, useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import {
  EMPTY_WIZARD_STATE,
  PROJECT_TRADES,
  validateWizardStep,
  type ProjectWizardState,
  type WizardFieldErrors,
} from '../lib/projectWizard'
import { submitProjectWizard } from '../lib/submitProjectWizard'
import { WizardShell } from '../components/project-wizard/WizardShell'
import { CategoryStep } from '../components/project-wizard/CategoryStep'
import { DescriptionStep } from '../components/project-wizard/DescriptionStep'
import { UploadStep } from '../components/project-wizard/UploadStep'
import { LocationStep } from '../components/project-wizard/LocationStep'
import { BudgetStep } from '../components/project-wizard/BudgetStep'
import { DeadlineStep } from '../components/project-wizard/DeadlineStep'
import { PreviewStep } from '../components/project-wizard/PreviewStep'
import type { TranslationKey } from '../lib/i18n'

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
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<WizardFieldErrors>({})

  useEffect(() => {
    if (!profile && !user) return
    setState((s) => ({
      ...s,
      contactName: s.contactName || profile?.full_name || '',
      contactPhone: s.contactPhone || profile?.phone || '',
      contactEmail: s.contactEmail || user?.email || '',
      preferredLanguage: s.preferredLanguage || language.code || 'en',
    }))
  }, [profile, user, language.code])

  // Prefill from AI Cost Estimator (sessionStorage)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('dimarket_estimator_project_prefill')
      if (!raw) return
      const data = JSON.parse(raw) as {
        tradeId?: string
        subcategorySlug?: string
        description?: string
        country?: string
        city?: string
        postalCode?: string
        locationLabel?: string
        latitude?: number | null
        longitude?: number | null
        budgetMin?: number
        budgetMax?: number
      }
      sessionStorage.removeItem('dimarket_estimator_project_prefill')
      setState((s) => ({
        ...s,
        tradeId: data.tradeId || s.tradeId,
        subcategorySlug: data.subcategorySlug || s.subcategorySlug,
        description: data.description || s.description,
        country: data.country || s.country,
        city: data.city || s.city,
        postalCode: data.postalCode || s.postalCode,
        locationLabel: data.locationLabel || s.locationLabel,
        latitude: data.latitude ?? s.latitude,
        longitude: data.longitude ?? s.longitude,
        budgetMin: data.budgetMin ?? s.budgetMin,
        budgetMax: data.budgetMax ?? s.budgetMax,
        step: data.tradeId ? 2 : s.step,
      }))
    } catch {
      /* ignore */
    }
  }, [])

  const patch = (p: Partial<ProjectWizardState>) => {
    setState((s) => ({ ...s, ...p }))
    setFieldErrors({})
    setError(null)
  }

  const trade = PROJECT_TRADES.find((x) => x.id === state.tradeId)
  const tradeLabel = trade ? t(trade.labelKey) : t('project.wizard.category')

  const titles: Record<number, { title: string; subtitle: string }> = {
    1: {
      title: tw(t, 'project.wizard.step1.title', 'What do you need?'),
      subtitle: tw(t, 'project.wizard.step1.sub', 'Choose a category'),
    },
    2: {
      title: tw(t, 'project.wizard.step2.title', 'Describe your project'),
      subtitle: tw(t, 'project.wizard.step2.sub', 'Share goals, size, and details'),
    },
    3: {
      title: tw(t, 'project.wizard.step3.title', 'Add photos & plans'),
      subtitle: tw(t, 'project.wizard.step3.sub', 'Images, video, or PDF — optional'),
    },
    4: {
      title: tw(t, 'project.wizard.step4.title', 'Where is the work?'),
      subtitle: tw(t, 'project.wizard.step4.sub', 'Country, city, postal code'),
    },
    5: {
      title: tw(t, 'project.wizard.step5.title', 'Budget'),
      subtitle: tw(t, 'project.wizard.step5.sub', 'Set a comfortable range'),
    },
    6: {
      title: tw(t, 'project.wizard.step6.title', 'When do you need it?'),
      subtitle: tw(t, 'project.wizard.step6.sub', 'Flexible, urgent, or a specific date'),
    },
    7: {
      title: tw(t, 'project.wizard.step7.previewTitle', 'Preview & publish'),
      subtitle: tw(t, 'project.wizard.step7.previewSub', 'Confirm details, then publish'),
    },
  }

  const goNext = () => {
    const errs = validateWizardStep(state.step, state)
    if (Object.keys(errs).length) {
      setFieldErrors(errs)
      setError(Object.values(errs)[0] || 'Please fix the highlighted fields')
      return
    }
    if (state.step < 7) {
      patch({ step: state.step + 1 })
      return
    }
    void submit()
  }

  const submit = async () => {
    if (!user) {
      navigateTo('/login')
      return
    }
    const errs = validateWizardStep(7, state)
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
    navigateTo(`/project/${result.listingId}/matches`)
  }

  if (!user) {
    return (
      <div className="create-project-page flex min-h-[60vh] flex-col items-center justify-center bg-[#f5f5f7] px-4 text-center">
        <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-[#1d1d1f]">
          {tw(t, 'project.wizard.loginTitle', 'Sign in to create a project')}
        </h1>
        <p className="mt-2 max-w-sm text-[15px] text-[#6e6e73]">
          Free to post. Matched with verified professionals near you.
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

  const meta = titles[state.step]

  return (
    <WizardShell
      step={state.step}
      title={meta.title}
      subtitle={meta.subtitle}
      backLabel={tw(t, 'common.back', 'Back')}
      nextLabel={
        state.step === 7
          ? tw(t, 'project.wizard.publish', 'Publish project')
          : tw(t, 'common.continue', 'Continue')
      }
      nextDisabled={busy}
      busy={busy}
      error={error}
      onBack={state.step > 1 ? () => patch({ step: state.step - 1 }) : undefined}
      onNext={goNext}
    >
      {state.step === 1 && (
        <CategoryStep
          selectedId={state.tradeId}
          onSelect={(tradeId, subcategorySlug) => patch({ tradeId, subcategorySlug })}
          t={t}
          error={fieldErrors.tradeId}
        />
      )}
      {state.step === 2 && (
        <DescriptionStep
          value={state.description}
          onChange={(description) => patch({ description })}
          placeholder={tw(
            t,
            'project.wizard.descPlaceholder',
            'I need to paint a 120m² apartment…',
          )}
          hint={tw(t, 'project.wizard.descHint', 'At least 20 characters')}
          error={fieldErrors.description}
        />
      )}
      {state.step === 3 && (
        <UploadStep
          files={state.files}
          onChange={(files) => patch({ files })}
          dropLabel={tw(t, 'project.wizard.drop', 'Drag & drop or click to upload')}
          help={tw(t, 'project.wizard.dropHelp', 'Photos, videos, PDF — up to 12 files')}
        />
      )}
      {state.step === 4 && (
        <LocationStep
          country={state.country}
          city={state.city}
          postalCode={state.postalCode}
          locationLabel={state.locationLabel}
          onChange={patch}
          labels={{
            country: tw(t, 'project.wizard.country', 'Country'),
            city: tw(t, 'project.wizard.city', 'City'),
            postal: tw(t, 'project.wizard.postal', 'Postal code'),
            search: tw(t, 'project.wizard.locationSearch', 'Search address'),
          }}
          errors={{
            country: fieldErrors.country,
            city: fieldErrors.city,
            postalCode: fieldErrors.postalCode,
          }}
        />
      )}
      {state.step === 5 && (
        <BudgetStep
          budgetMin={state.budgetMin}
          budgetMax={state.budgetMax}
          onChange={(budgetMin, budgetMax) => patch({ budgetMin, budgetMax })}
          labels={{
            min: tw(t, 'project.wizard.budgetMin', 'Minimum €'),
            max: tw(t, 'project.wizard.budgetMax', 'Maximum €'),
            range: tw(t, 'project.wizard.budgetRange', 'Your estimated budget'),
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
            flexible: tw(t, 'project.wizard.flexible', 'Flexible'),
            urgent: tw(t, 'project.wizard.asap', 'Urgent'),
            date: tw(t, 'project.wizard.specificDate', 'Specific date'),
            pickDate: tw(t, 'project.wizard.pickDate', 'Pick a date'),
          }}
          error={fieldErrors.deadlineAt}
        />
      )}
      {state.step === 7 && (
        <PreviewStep
          state={state}
          tradeLabel={tradeLabel}
          onChange={patch}
          errors={fieldErrors}
          labels={{
            category: tw(t, 'project.wizard.category', 'Category'),
            description: tw(t, 'project.wizard.description', 'Description'),
            media: tw(t, 'project.wizard.media', 'Media'),
            location: tw(t, 'project.wizard.location', 'Location'),
            budget: tw(t, 'project.wizard.budget', 'Budget'),
            deadline: tw(t, 'project.wizard.deadline', 'Deadline'),
            contact: tw(t, 'project.wizard.contact', 'Contact'),
            name: tw(t, 'project.wizard.name', 'Name'),
            phone: tw(t, 'project.wizard.phone', 'Phone'),
            email: tw(t, 'project.wizard.email', 'Email'),
            files: tw(t, 'project.wizard.files', 'files'),
            flexible: tw(t, 'project.wizard.flexible', 'Flexible'),
            urgent: tw(t, 'project.wizard.asap', 'Urgent'),
            date: tw(t, 'project.wizard.specificDate', 'Date'),
          }}
        />
      )}
    </WizardShell>
  )
}

export { ProjectWizard as CreateProject }
