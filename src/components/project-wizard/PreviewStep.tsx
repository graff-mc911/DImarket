import { Pencil } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ProjectWizardState, WizardPreferences } from '../../lib/projectWizard'
import { BUDGET_BANDS, PROJECT_TRADES } from '../../lib/projectWizard'

type PreviewStepProps = {
  state: ProjectWizardState
  tradeLabel: string
  onChange: (patch: Partial<ProjectWizardState>) => void
  onEditStep: (step: number) => void
  errors?: Partial<Record<string, string>>
  labels: {
    category: string
    description: string
    media: string
    location: string
    budget: string
    deadline: string
    preferences: string
    contact: string
    name: string
    phone: string
    email: string
    files: string
    edit: string
    asap: string
    thisWeek: string
    thisMonth: string
    flexible: string
    date: string
    prefVerified: string
    prefCompanies: string
    prefEmergency: string
    prefPremium: string
    prefInsurance: string
    prefWarranty: string
  }
}

const PREF_KEYS: Array<{
  key: keyof WizardPreferences
  label: keyof PreviewStepProps['labels']
}> = [
  { key: 'verifiedOnly', label: 'prefVerified' },
  { key: 'companiesOnly', label: 'prefCompanies' },
  { key: 'emergency', label: 'prefEmergency' },
  { key: 'premiumOnly', label: 'prefPremium' },
  { key: 'insuranceRequired', label: 'prefInsurance' },
  { key: 'warrantyRequired', label: 'prefWarranty' },
]

function Block({
  title,
  onEdit,
  editLabel,
  children,
}: {
  title: string
  onEdit: () => void
  editLabel: string
  children: ReactNode
}) {
  return (
    <div className="rounded-[22px] border border-[#e8e8ed] p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
          {title}
        </p>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#6e6e73] hover:text-[#1d1d1f]"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden />
          {editLabel}
        </button>
      </div>
      <div className="mt-2">{children}</div>
    </div>
  )
}

export function PreviewStep({
  state,
  tradeLabel,
  onChange,
  onEditStep,
  errors = {},
  labels,
}: PreviewStepProps) {
  const trade = PROJECT_TRADES.find((t) => t.id === state.tradeId)
  const Icon = trade?.icon
  const band = BUDGET_BANDS.find((b) => b.id === state.budgetBand)
  const deadlineLabel =
    state.deadlineType === 'flexible'
      ? labels.flexible
      : state.deadlineType === 'asap'
        ? labels.asap
        : state.deadlineType === 'this_week'
          ? labels.thisWeek
          : state.deadlineType === 'this_month'
            ? labels.thisMonth
            : `${labels.date}: ${state.deadlineAt}`

  const prefs = PREF_KEYS.filter((p) => state.preferences[p.key])

  return (
    <div className="space-y-4">
      <Block title={labels.category} onEdit={() => onEditStep(1)} editLabel={labels.edit}>
        <div className="flex items-center gap-3">
          {Icon ? (
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f5f7]">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
          ) : null}
          <p className="text-[18px] font-semibold text-[#1d1d1f]">{tradeLabel}</p>
        </div>
      </Block>

      <Block title={labels.description} onEdit={() => onEditStep(2)} editLabel={labels.edit}>
        <p className="whitespace-pre-wrap text-[15px] leading-6 text-[#1d1d1f]">{state.description}</p>
      </Block>

      <Block title={labels.media} onEdit={() => onEditStep(3)} editLabel={labels.edit}>
        {state.files.length ? (
          <div className="flex gap-2 overflow-x-auto">
            {state.files.map((f) =>
              f.kind === 'photo' ? (
                <img
                  key={f.previewUrl}
                  src={f.previewUrl}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div
                  key={f.previewUrl}
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#f5f5f7] text-[10px] font-medium"
                >
                  {f.kind.toUpperCase()}
                </div>
              ),
            )}
          </div>
        ) : (
          <p className="text-[14px] text-[#86868b]">0 {labels.files}</p>
        )}
      </Block>

      <Block title={labels.location} onEdit={() => onEditStep(4)} editLabel={labels.edit}>
        <p className="text-[15px] text-[#1d1d1f]">
          {[state.city, state.postalCode, state.country].filter(Boolean).join(', ')}
        </p>
        {state.locationLabel ? (
          <p className="mt-1 text-[13px] text-[#6e6e73]">{state.locationLabel}</p>
        ) : null}
      </Block>

      <Block title={labels.budget} onEdit={() => onEditStep(5)} editLabel={labels.edit}>
        <p className="text-[15px] font-semibold text-[#1d1d1f]">
          {band?.label || 'Custom'} · €{state.budgetMin.toLocaleString()} – €
          {state.budgetMax.toLocaleString()}
        </p>
      </Block>

      <Block title={labels.deadline} onEdit={() => onEditStep(6)} editLabel={labels.edit}>
        <p className="text-[15px] text-[#1d1d1f]">{deadlineLabel}</p>
      </Block>

      <Block title={labels.preferences} onEdit={() => onEditStep(7)} editLabel={labels.edit}>
        {prefs.length ? (
          <ul className="flex flex-wrap gap-2">
            {prefs.map((p) => (
              <li
                key={p.key}
                className="rounded-full bg-[#f5f5f7] px-3 py-1 text-[12px] font-semibold text-[#1d1d1f]"
              >
                {labels[p.label]}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[14px] text-[#86868b]">No extra preferences</p>
        )}
      </Block>

      <div className="rounded-[22px] border border-[#e8e8ed] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
          {labels.contact}
        </p>
        <div className="mt-3 space-y-3">
          <div>
            <label className="mb-1 block text-[12px] font-medium text-[#86868b]">{labels.name}</label>
            <input
              value={state.contactName}
              onChange={(e) => onChange({ contactName: e.target.value })}
              className={
                'w-full rounded-[14px] border bg-[#fafafa] px-4 py-3 text-[15px] outline-none focus:bg-white ' +
                (errors.contactName ? 'border-[#c41e3a]' : 'border-[#e8e8ed]')
              }
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[12px] font-medium text-[#86868b]">
                {labels.phone}
              </label>
              <input
                value={state.contactPhone}
                onChange={(e) => onChange({ contactPhone: e.target.value })}
                className="w-full rounded-[14px] border border-[#e8e8ed] bg-[#fafafa] px-4 py-3 text-[15px] outline-none focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-[#86868b]">
                {labels.email}
              </label>
              <input
                value={state.contactEmail}
                onChange={(e) => onChange({ contactEmail: e.target.value })}
                className={
                  'w-full rounded-[14px] border bg-[#fafafa] px-4 py-3 text-[15px] outline-none focus:bg-white ' +
                  (errors.contactEmail || errors.contact ? 'border-[#c41e3a]' : 'border-[#e8e8ed]')
                }
              />
            </div>
          </div>
          {errors.contact ? <p className="text-[12px] text-[#c41e3a]">{errors.contact}</p> : null}
        </div>
      </div>
    </div>
  )
}
