type DescriptionStepProps = {
  value: string
  onChange: (v: string) => void
  placeholder: string
  hint: string
}

export function DescriptionStep({ value, onChange, placeholder, hint }: DescriptionStepProps) {
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={8}
        placeholder={placeholder}
        className="w-full rounded-sm border border-[#888c8c] px-3 py-3 text-sm leading-6 text-[var(--ink-900)] outline-none focus:border-[#ff9900] focus:shadow-[0_0_0_3px_rgba(255,153,0,0.25)]"
      />
      <p className="mt-2 text-xs text-[var(--ink-500)]">{hint}</p>
    </div>
  )
}
