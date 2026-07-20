type DescriptionStepProps = {
  value: string
  onChange: (v: string) => void
  placeholder: string
  hint: string
  error?: string
}

export function DescriptionStep({ value, onChange, placeholder, hint, error }: DescriptionStepProps) {
  const len = value.trim().length
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={9}
        placeholder={placeholder}
        className={
          'w-full resize-y rounded-[20px] border bg-[#fafafa] px-4 py-4 text-[16px] leading-7 text-[#1d1d1f] outline-none transition placeholder:text-[#aeaeb2] focus:bg-white ' +
          (error
            ? 'border-[#c41e3a]'
            : 'border-[#e8e8ed] focus:border-[#1d1d1f] focus:shadow-[0_0_0_4px_rgba(0,0,0,0.06)]')
        }
      />
      <div className="mt-2 flex items-center justify-between gap-3 text-[12px]">
        <p className={error ? 'text-[#c41e3a]' : 'text-[#86868b]'}>{error || hint}</p>
        <p className={'tabular-nums ' + (len < 20 ? 'text-[#c41e3a]' : 'text-[#86868b]')}>
          {len}/20+
        </p>
      </div>
    </div>
  )
}
