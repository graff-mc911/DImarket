type BudgetStepProps = {
  budgetMin: number
  budgetMax: number
  onChange: (min: number, max: number) => void
  labels: { min: string; max: string; range: string }
}

export function BudgetStep({ budgetMin, budgetMax, onChange, labels }: BudgetStepProps) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-[var(--ink-600)]">{labels.range}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-bold text-[var(--ink-700)]">{labels.min}</label>
          <input
            type="number"
            min={0}
            value={budgetMin}
            onChange={(e) => onChange(Number(e.target.value) || 0, budgetMax)}
            className="w-full rounded-sm border border-[#888c8c] px-3 py-2.5 text-sm outline-none focus:border-[#ff9900]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-[var(--ink-700)]">{labels.max}</label>
          <input
            type="number"
            min={0}
            value={budgetMax}
            onChange={(e) => onChange(budgetMin, Number(e.target.value) || 0)}
            className="w-full rounded-sm border border-[#888c8c] px-3 py-2.5 text-sm outline-none focus:border-[#ff9900]"
          />
        </div>
      </div>
      <input
        type="range"
        min={100}
        max={50000}
        step={100}
        value={budgetMax}
        onChange={(e) => {
          const max = Number(e.target.value)
          onChange(Math.min(budgetMin, max), max)
        }}
        className="w-full accent-[#ff9900]"
      />
      <p className="text-center text-lg font-bold text-[var(--ink-900)]">
        €{budgetMin.toLocaleString()} – €{budgetMax.toLocaleString()}
      </p>
    </div>
  )
}
