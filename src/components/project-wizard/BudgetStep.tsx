import {
  BUDGET_BANDS,
  type WizardBudgetBand,
} from '../../lib/projectWizard'

type BudgetStepProps = {
  budgetBand: WizardBudgetBand
  budgetMin: number
  budgetMax: number
  onBandChange: (band: WizardBudgetBand) => void
  onCustomChange: (min: number, max: number) => void
  labels: { min: string; max: string; range: string; custom: string }
  errors?: Partial<Record<'budgetMin' | 'budgetMax', string>>
}

export function BudgetStep({
  budgetBand,
  budgetMin,
  budgetMax,
  onBandChange,
  onCustomChange,
  labels,
  errors = {},
}: BudgetStepProps) {
  return (
    <div className="space-y-5" role="radiogroup" aria-label={labels.range}>
      <div className="grid gap-3">
        {BUDGET_BANDS.map((band) => {
          const active = budgetBand === band.id
          return (
            <button
              key={band.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onBandChange(band.id)}
              className={
                'flex items-center justify-between rounded-[20px] border px-5 py-4 text-left transition ' +
                (active
                  ? 'border-[#1d1d1f] bg-[#1d1d1f] text-white'
                  : 'border-[#e8e8ed] bg-[#fafafa] text-[#1d1d1f] hover:bg-white')
              }
            >
              <span className="text-[16px] font-semibold">
                {band.id === 'custom' ? labels.custom : band.label}
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

      {budgetBand === 'custom' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
              {labels.min}
            </label>
            <input
              type="number"
              min={0}
              value={budgetMin}
              onChange={(e) => {
                const min = Number(e.target.value) || 0
                onCustomChange(min, Math.max(min, budgetMax))
              }}
              className={
                'w-full rounded-[14px] border bg-[#fafafa] px-4 py-3 text-[15px] outline-none focus:bg-white ' +
                (errors.budgetMin ? 'border-[#c41e3a]' : 'border-[#e8e8ed] focus:border-[#1d1d1f]')
              }
            />
            {errors.budgetMin ? (
              <p className="mt-1 text-[12px] text-[#c41e3a]">{errors.budgetMin}</p>
            ) : null}
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
              {labels.max}
            </label>
            <input
              type="number"
              min={0}
              value={budgetMax}
              onChange={(e) => {
                const max = Number(e.target.value) || 0
                onCustomChange(Math.min(budgetMin, max), max)
              }}
              className={
                'w-full rounded-[14px] border bg-[#fafafa] px-4 py-3 text-[15px] outline-none focus:bg-white ' +
                (errors.budgetMax ? 'border-[#c41e3a]' : 'border-[#e8e8ed] focus:border-[#1d1d1f]')
              }
            />
            {errors.budgetMax ? (
              <p className="mt-1 text-[12px] text-[#c41e3a]">{errors.budgetMax}</p>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="text-center text-[28px] font-semibold tracking-[-0.03em] text-[#1d1d1f]">
          €{budgetMin.toLocaleString()} – €{budgetMax.toLocaleString()}
        </p>
      )}
    </div>
  )
}
