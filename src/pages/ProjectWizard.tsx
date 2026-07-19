import { useEffect, useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import {
  EMPTY_WIZARD_STATE,
  PROJECT_TRADES,
  type ProjectWizardState,
} from '../lib/projectWizard'
import { submitProjectWizard } from '../lib/submitProjectWizard'
import { WizardShell } from '../components/project-wizard/WizardShell'
import { CategoryStep } from '../components/project-wizard/CategoryStep'
import { DescriptionStep } from '../components/project-wizard/DescriptionStep'
import { UploadStep } from '../components/project-wizard/UploadStep'
import { LocationStep } from '../components/project-wizard/LocationStep'
import { BudgetStep } from '../components/project-wizard/BudgetStep'
import { DeadlineStep } from '../components/project-wizard/DeadlineStep'
import { ContactStep } from '../components/project-wizard/ContactStep'
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

export function ProjectWizard() {
  const { user, profile, language, t } = useApp()
  const [state, setState] = useState<ProjectWizardState>(EMPTY_WIZARD_STATE)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile && !user) return
    setState((s) => ({
      ...s,
      contactName: s.contactName || profile?.full_name || '',
      contactPhone: s.contactPhone || profile?.phone || '',
      contactEmail: s.contactEmail || user?.email || '',
      preferredLanguage: s.preferredLanguage || language.code || 'uk',
    }))
  }, [profile, user, language.code])

  const patch = (p: Partial<ProjectWizardState>) => setState((s) => ({ ...s, ...p }))

  const canNext = () => {
    switch (state.step) {
      case 1:
        return Boolean(state.tradeId)
      case 2:
        return state.description.trim().length >= 20
      case 3:
        return true
      case 4:
        return Boolean(state.city.trim() || state.locationLabel.trim())
      case 5:
        return state.budgetMax >= state.budgetMin && state.budgetMax > 0
      case 6:
        return state.deadlineType !== 'date' || Boolean(state.deadlineAt)
      case 7:
        return Boolean(state.contactName.trim() && (state.contactEmail.trim() || state.contactPhone.trim()))
      default:
        return false
    }
  }

  const submit = async () => {
    if (!user) {
      navigateTo('/login')
      return
    }
    setBusy(true)
    setError(null)
    const trade = PROJECT_TRADES.find((x) => x.id === state.tradeId)
    const tradeLabel = trade ? tw(t, trade.labelKey, trade.id) : 'Project'
    const result = await submitProjectWizard(user.id, state, tradeLabel)
    setBusy(false)
    if ('error' in result) {
      setError(result.error)
      return
    }
    navigateTo(`/project/${result.listingId}/matches`)
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="text-2xl font-bold text-[var(--ink-900)]">
          {tw(t, 'project.wizard.loginTitle', 'Sign in to create a project')}
        </h1>
        <button type="button" className="btn-primary mt-6" onClick={() => navigateTo('/login')}>
          {tw(t, 'login.title', 'Sign in')}
        </button>
      </div>
    )
  }

  const titles: Record<number, { title: string; subtitle: string }> = {
    1: {
      title: tw(t, 'project.wizard.step1.title', 'What do you need help with?'),
      subtitle: tw(t, 'project.wizard.step1.sub', 'Choose a trade category'),
    },
    2: {
      title: tw(t, 'project.wizard.step2.title', 'Describe your project'),
      subtitle: tw(t, 'project.wizard.step2.sub', 'The more detail, the better the matches'),
    },
    3: {
      title: tw(t, 'project.wizard.step3.title', 'Add photos or plans'),
      subtitle: tw(t, 'project.wizard.step3.sub', 'Optional — photos, video, or PDF'),
    },
    4: {
      title: tw(t, 'project.wizard.step4.title', 'Where is the project?'),
      subtitle: tw(t, 'project.wizard.step4.sub', 'Country, city and postal code'),
    },
    5: {
      title: tw(t, 'project.wizard.step5.title', 'Budget'),
      subtitle: tw(t, 'project.wizard.step5.sub', 'Set a comfortable range'),
    },
    6: {
      title: tw(t, 'project.wizard.step6.title', 'When do you need it?'),
      subtitle: tw(t, 'project.wizard.step6.sub', 'Deadline preference'),
    },
    7: {
      title: tw(t, 'project.wizard.step7.title', 'Contact details'),
      subtitle: tw(t, 'project.wizard.step7.sub', 'Professionals will reach you here'),
    },
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
          ? tw(t, 'project.wizard.submit', 'Find professionals')
          : tw(t, 'common.continue', 'Continue')
      }
      nextDisabled={!canNext()}
      busy={busy}
      onBack={state.step > 1 ? () => patch({ step: state.step - 1 }) : undefined}
      onNext={() => {
        if (state.step < 7) patch({ step: state.step + 1 })
        else void submit()
      }}
    >
      {error && (
        <p className="mb-4 rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {state.step === 1 && (
        <CategoryStep
          selectedId={state.tradeId}
          onSelect={(tradeId, subcategorySlug) => patch({ tradeId, subcategorySlug })}
          t={(key) => tw(t, key, key.split('.').pop() || key)}
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
            asap: tw(t, 'project.wizard.asap', 'ASAP'),
            date: tw(t, 'project.wizard.specificDate', 'Specific date'),
            pickDate: tw(t, 'project.wizard.pickDate', 'Pick a date'),
          }}
        />
      )}
      {state.step === 7 && (
        <ContactStep
          contactName={state.contactName}
          contactPhone={state.contactPhone}
          contactEmail={state.contactEmail}
          preferredLanguage={state.preferredLanguage}
          onChange={patch}
          labels={{
            name: tw(t, 'project.wizard.name', 'Name'),
            phone: tw(t, 'project.wizard.phone', 'Phone'),
            email: tw(t, 'project.wizard.email', 'Email'),
            language: tw(t, 'project.wizard.language', 'Preferred language'),
          }}
          languages={[
            { code: 'uk', label: 'Ukrainian' },
            { code: 'en', label: 'English' },
            { code: 'de', label: 'German' },
            { code: 'pl', label: 'Polish' },
            { code: 'ru', label: 'Russian' },
          ]}
        />
      )}
    </WizardShell>
  )
}
