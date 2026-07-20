type BudgetStepProps = {
  budgetMin: number
  budgetMax: number
  onChange: (min: number, max: number) => void
  labels: { min: string; max: string; range: string }
  errors?: Partial<Record<'budgetMin' | 'budgetMax', string>>
}

export function BudgetStep({ budgetMin, budgetMax, onChange, labels, errors = {} }: BudgetStepProps) {
  return (
    <div className="space-y-6">
      <p className="text-center text-[15px] text-[#6e6e73]">{labels.range}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
            {labels.min}
          </label>
          <input
            type="number"
            min={0}
            value={budgetMin}
            onChange={(e) => onChange(Number(e.target.value) || 0, budgetMax)}
            className={
              'w-full rounded-[14px] border bg-[#fafafa] px-4 py-3 text-[15px] outline-none focus:bg-white ' +
              (errors.budgetMin ? 'border-[#c41e3a]' : 'border-[#e8e8ed] focus:border-[#1d1d1f]')
            }
          />
          {errors.budgetMin ? <p className="mt-1 text-[12px] text-[#c41e3a]">{errors.budgetMin}</p> : null}
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
            {labels.max}
          </label>
          <input
            type="number"
            min={0}
            value={budgetMax}
            onChange={(e) => onChange(budgetMin, Number(e.target.value) || 0)}
            className={
              'w-full rounded-[14px] border bg-[#fafafa] px-4 py-3 text-[15px] outline-none focus:bg-white ' +
              (errors.budgetMax ? 'border-[#c41e3a]' : 'border-[#e8e8ed] focus:border-[#1d1d1f]')
            }
          />
          {errors.budgetMax ? <p className="mt-1 text-[12px] text-[#c41e3a]">{errors.budgetMax}</p> : null}
        </div>
      </div>

      <div className="rounded-[20px] bg-[#f5f5f7] px-5 py-6">
        <input
          type="range"
          min={100}
          max={50000}
          step={100}
          value={Math.min(50000, Math.max(100, budgetMax))}
          onChange={(e) => {
            const max = Number(e.target.value)
            onChange(Math.min(budgetMin, max), max)
          }}
          className="w-full accent-[#1d1d1f]"
        />
        <p className="mt-4 text-center text-[28px] font-semibold tracking-[-0.03em] text-[#1d1d1f]">
          €{budgetMin.toLocaleString()} – €{budgetMax.toLocaleString()}
        </p>
      </div>
    </div>
  )
}
