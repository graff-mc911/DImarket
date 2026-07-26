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
    asap: string
    thisWeek: string
    thisMonth: string
    flexible: string
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
  const options: { id: WizardDeadlineType; label: string; hint: string; urgency: WizardUrgency }[] =
    [
      { id: 'asap', label: labels.asap, hint: 'Start as soon as possible', urgency: 'urgent' },
      { id: 'this_week', label: labels.thisWeek, hint: 'Within 7 days', urgency: 'high' },
      { id: 'this_month', label: labels.thisMonth, hint: 'Within 30 days', urgency: 'normal' },
      { id: 'flexible', label: labels.flexible, hint: 'No fixed deadline', urgency: 'low' },
      { id: 'date', label: labels.date, hint: 'Pick a specific day', urgency: 'normal' },
    ]

  return (
    <div className="space-y-4" role="radiogroup" aria-label="Timeline">
      <div className="grid gap-3">
        {options.map((o) => {
          const active = deadlineType === o.id
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() =>
                onChange({
                  deadlineType: o.id,
                  urgency: o.urgency,
                })
              }
              className={
                'flex items-center justify-between rounded-[20px] border px-5 py-4 text-left transition ' +
                (active
                  ? 'border-[#1d1d1f] bg-[#1d1d1f] text-white'
                  : 'border-[#e8e8ed] bg-[#fafafa] text-[#1d1d1f] hover:bg-white')
              }
            >
              <span>
                <span className="block text-[16px] font-semibold">{o.label}</span>
                <span className={'text-[13px] ' + (active ? 'text-white/70' : 'text-[#86868b]')}>
                  {o.hint}
                </span>
              </span>
              <span
                className={
                  'flex h-5 w-5 items-center justify-center rounded-full border-2 ' +
                  (active ? 'border-white bg-white' : 'border-[#d2d2d7]')
                }
              >
                {active ? <span className="h-2 w-2 rounded-full bg-[#1d1d1f]" /> : null}
              </span>
            </button>
          )
        })}
      </div>

      {deadlineType === 'date' && (
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
            {labels.pickDate}
          </label>
          <input
            type="date"
            value={deadlineAt}
            onChange={(e) => onChange({ deadlineAt: e.target.value })}
            className="w-full max-w-xs rounded-[14px] border border-[#e8e8ed] bg-[#fafafa] px-4 py-3 text-[15px] outline-none focus:border-[#1d1d1f] focus:bg-white"
          />
        </div>
      )}
      {error ? <p className="text-[13px] text-[#c41e3a]">{error}</p> : null}
    </div>
  )
}
