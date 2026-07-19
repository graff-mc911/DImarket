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
    asap: string
    date: string
    pickDate: string
  }
}

export function DeadlineStep({
  deadlineType,
  deadlineAt,
  onChange,
  labels,
}: DeadlineStepProps) {
  const options: { id: WizardDeadlineType; label: string }[] = [
    { id: 'flexible', label: labels.flexible },
    { id: 'asap', label: labels.asap },
    { id: 'date', label: labels.date },
  ]

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {options.map((o) => (
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
              'rounded-sm border px-4 py-4 text-sm font-semibold transition ' +
              (deadlineType === o.id
                ? 'border-[#ff9900] bg-[#fff8e7] text-[#c45500]'
                : 'border-[#d5d9d9] bg-white text-[var(--ink-800)] hover:border-[#ff9900]')
            }
          >
            {o.label}
          </button>
        ))}
      </div>
      {deadlineType === 'date' && (
        <div>
          <label className="mb-1 block text-xs font-bold text-[var(--ink-700)]">{labels.pickDate}</label>
          <input
            type="date"
            value={deadlineAt}
            onChange={(e) => onChange({ deadlineAt: e.target.value })}
            className="w-full max-w-xs rounded-sm border border-[#888c8c] px-3 py-2.5 text-sm outline-none focus:border-[#ff9900]"
          />
        </div>
      )}
    </div>
  )
}
