import type { ProjectWizardState } from '../../lib/projectWizard'
import { PROJECT_TRADES } from '../../lib/projectWizard'

type PreviewStepProps = {
  state: ProjectWizardState
  tradeLabel: string
  onChange: (patch: Partial<ProjectWizardState>) => void
  errors?: Partial<Record<string, string>>
  labels: {
    category: string
    description: string
    media: string
    location: string
    budget: string
    deadline: string
    contact: string
    name: string
    phone: string
    email: string
    files: string
    flexible: string
    urgent: string
    date: string
  }
}

export function PreviewStep({ state, tradeLabel, onChange, errors = {}, labels }: PreviewStepProps) {
  const trade = PROJECT_TRADES.find((t) => t.id === state.tradeId)
  const Icon = trade?.icon
  const deadlineLabel =
    state.deadlineType === 'flexible'
      ? labels.flexible
      : state.deadlineType === 'asap'
        ? labels.urgent
        : `${labels.date}: ${state.deadlineAt}`

  return (
    <div className="space-y-5">
      <div className="rounded-[22px] bg-[#f5f5f7] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
          {labels.category}
        </p>
        <div className="mt-2 flex items-center gap-3">
          {Icon ? (
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
              <Icon className="h-5 w-5" />
            </span>
          ) : null}
          <p className="text-[18px] font-semibold text-[#1d1d1f]">{tradeLabel}</p>
        </div>
      </div>

      <div className="rounded-[22px] border border-[#e8e8ed] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
          {labels.description}
        </p>
        <p className="mt-2 whitespace-pre-wrap text-[15px] leading-6 text-[#1d1d1f]">
          {state.description}
        </p>
      </div>

      {state.files.length > 0 && (
        <div className="rounded-[22px] border border-[#e8e8ed] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
            {labels.media} · {state.files.length} {labels.files}
          </p>
          <div className="mt-3 flex gap-2 overflow-x-auto">
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
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[22px] border border-[#e8e8ed] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
            {labels.location}
          </p>
          <p className="mt-2 text-[15px] font-medium text-[#1d1d1f]">
            {[state.city, state.postalCode, state.country].filter(Boolean).join(', ')}
          </p>
        </div>
        <div className="rounded-[22px] border border-[#e8e8ed] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
            {labels.budget}
          </p>
          <p className="mt-2 text-[15px] font-medium text-[#1d1d1f]">
            €{state.budgetMin.toLocaleString()} – €{state.budgetMax.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="rounded-[22px] border border-[#e8e8ed] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
          {labels.deadline}
        </p>
        <p className="mt-2 text-[15px] font-medium text-[#1d1d1f]">{deadlineLabel}</p>
      </div>

      <div className="rounded-[22px] border border-[#e8e8ed] p-5">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
          {labels.contact}
        </p>
        <div className="grid gap-3">
          <input
            value={state.contactName}
            onChange={(e) => onChange({ contactName: e.target.value })}
            placeholder={labels.name}
            className="rounded-[14px] border border-[#e8e8ed] bg-[#fafafa] px-4 py-3 text-[15px] outline-none focus:border-[#1d1d1f]"
          />
          {errors.contactName ? (
            <p className="text-[12px] text-[#c41e3a]">{errors.contactName}</p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={state.contactPhone}
              onChange={(e) => onChange({ contactPhone: e.target.value })}
              placeholder={labels.phone}
              className="rounded-[14px] border border-[#e8e8ed] bg-[#fafafa] px-4 py-3 text-[15px] outline-none focus:border-[#1d1d1f]"
            />
            <input
              type="email"
              value={state.contactEmail}
              onChange={(e) => onChange({ contactEmail: e.target.value })}
              placeholder={labels.email}
              className="rounded-[14px] border border-[#e8e8ed] bg-[#fafafa] px-4 py-3 text-[15px] outline-none focus:border-[#1d1d1f]"
            />
          </div>
          {errors.contactEmail ? (
            <p className="text-[12px] text-[#c41e3a]">{errors.contactEmail}</p>
          ) : null}
          {errors.contact ? <p className="text-[12px] text-[#c41e3a]">{errors.contact}</p> : null}
        </div>
      </div>
    </div>
  )
}
