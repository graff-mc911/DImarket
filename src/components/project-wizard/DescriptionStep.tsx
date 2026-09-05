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
          'w-full resize-y rounded-none border bg-[#fafafa] px-4 py-4 text-[16px] leading-7 text-[#2f2a24] outline-none transition placeholder:text-[#aeaeb2] focus:bg-white ' +
          (error
            ? 'border-[#c41e3a]'
            : 'border-[rgba(148,163,184,0.22)] focus:border-[#2f2a24] focus:shadow-[0_0_0_4px_rgba(0,0,0,0.06)]')
        }
      />
      <div className="mt-2 flex items-center justify-between gap-3 text-[12px]">
        <p className={error ? 'text-[#c41e3a]' : 'text-[#8a8178]'}>{error || hint}</p>
        <p className={'tabular-nums ' + (len < 20 ? 'text-[#c41e3a]' : 'text-[#8a8178]')}>
          {len}/20+
        </p>
      </div>
    </div>
  )
}
