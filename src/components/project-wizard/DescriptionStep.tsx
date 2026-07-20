type DescriptionStepProps = {
  value: string
  onChange: (v: string) => void
  placeholder: string
  hint: string
  error?: string
}

export function DescriptionStep({
  value,
  onChange,
  placeholder,
  hint,
  error,
}: DescriptionStepProps) {
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={9}
        placeholder={placeholder}
        className={
          'w-full resize-none rounded-[20px] border bg-[#fafafa] px-4 py-4 text-[16px] leading-7 text-[#1d1d1f] outline-none transition placeholder:text-[#aeaeb2] focus:bg-white ' +
          (error
            ? 'border-[#c41e3a] focus:shadow-[0_0_0_4px_rgba(196,30,58,0.12)]'
            : 'border-[#e8e8ed] focus:border-[#1d1d1f] focus:shadow-[0_0_0_4px_rgba(0,0,0,0.06)]')
        }
      />
      <div className="mt-2 flex items-center justify-between text-[12px] text-[#86868b]">
        <span>{error || hint}</span>
        <span className="tabular-nums">{value.trim().length}</span>
      </div>
    </div>
  )
}
