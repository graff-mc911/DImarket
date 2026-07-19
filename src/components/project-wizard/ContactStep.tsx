type ContactStepProps = {
  contactName: string
  contactPhone: string
  contactEmail: string
  preferredLanguage: string
  onChange: (patch: Partial<ContactStepProps>) => void
  labels: {
    name: string
    phone: string
    email: string
    language: string
  }
  languages: { code: string; label: string }[]
}

export function ContactStep({
  contactName,
  contactPhone,
  contactEmail,
  preferredLanguage,
  onChange,
  labels,
  languages,
}: ContactStepProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs font-bold text-[var(--ink-700)]">{labels.name}</label>
        <input
          value={contactName}
          onChange={(e) => onChange({ contactName: e.target.value })}
          className="w-full rounded-sm border border-[#888c8c] px-3 py-2.5 text-sm outline-none focus:border-[#ff9900]"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-bold text-[var(--ink-700)]">{labels.phone}</label>
        <input
          value={contactPhone}
          onChange={(e) => onChange({ contactPhone: e.target.value })}
          className="w-full rounded-sm border border-[#888c8c] px-3 py-2.5 text-sm outline-none focus:border-[#ff9900]"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-bold text-[var(--ink-700)]">{labels.email}</label>
        <input
          type="email"
          value={contactEmail}
          onChange={(e) => onChange({ contactEmail: e.target.value })}
          className="w-full rounded-sm border border-[#888c8c] px-3 py-2.5 text-sm outline-none focus:border-[#ff9900]"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs font-bold text-[var(--ink-700)]">{labels.language}</label>
        <select
          value={preferredLanguage}
          onChange={(e) => onChange({ preferredLanguage: e.target.value })}
          className="w-full rounded-sm border border-[#888c8c] px-3 py-2.5 text-sm outline-none focus:border-[#ff9900]"
        >
          {languages.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
