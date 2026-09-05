import type { WizardDeadlineType, WizardUrgency } from '../../lib/projectWizard'

type DeadlineStepProps = {
  deadlineType: WizardDeadlineType
  deadlineAt: string
  urgency: WizardUrgency
  onChange: (patch: {
    deadlineType?: WizardDeadlineType
    deadlineAt?: string
    urgency?: WizardUrgency
  }) => void
  labels: {
    flexible: string
    urgent: string
    date: string
    pickDate: string
  }
  error?: string
}

export function DeadlineStep({
  deadlineType,
  deadlineAt,
  onChange,
  labels,
  error,
}: DeadlineStepProps) {
  const options: { id: WizardDeadlineType; label: string; hint: string }[] = [
    { id: 'flexible', label: labels.flexible, hint: 'No rush' },
    { id: 'asap', label: labels.urgent, hint: 'As soon as possible' },
    { id: 'date', label: labels.date, hint: 'Pick a day' },
  ]

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {options.map((o) => {
          const active = deadlineType === o.id
          return (
            <button
              key={o.id}
              type="button"
              onClick={() =>
                onChange({
                  deadlineType: o.id,
                  urgency: o.id === 'asap' ? 'urgent' : 'normal',
                })
              }
              className={
                'flex items-center justify-between rounded-none border px-5 py-4 text-left transition ' +
                (active
                  ? 'border-[#2f2a24] bg-[#2f2a24] text-white'
                  : 'border-[rgba(148,163,184,0.22)] bg-[#fafafa] text-[#2f2a24] hover:bg-white')
              }
            >
              <span>
                <span className="block text-[16px] font-semibold">{o.label}</span>
                <span className={'text-[13px] ' + (active ? 'text-white/70' : 'text-[#8a8178]')}>
                  {o.hint}
                </span>
              </span>
              <span
                className={
                  'flex h-5 w-5 items-center justify-center rounded-full border-2 ' +
                  (active ? 'border-white bg-white' : 'border-[rgba(148,163,184,0.35)]')
                }
              >
                {active ? <span className="h-2 w-2 rounded-full bg-[#2f2a24]" /> : null}
              </span>
            </button>
          )
        })}
      </div>

      {deadlineType === 'date' && (
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.06em] text-[#8a8178]">
            {labels.pickDate}
          </label>
          <input
            type="date"
            value={deadlineAt}
            onChange={(e) => onChange({ deadlineAt: e.target.value })}
            className="w-full max-w-xs rounded-none border border-[rgba(148,163,184,0.22)] bg-[#fafafa] px-4 py-3 text-[15px] outline-none focus:border-[#2f2a24] focus:bg-white"
          />
        </div>
      )}
      {error ? <p className="text-[13px] text-[#c41e3a]">{error}</p> : null}
    </div>
  )
}
