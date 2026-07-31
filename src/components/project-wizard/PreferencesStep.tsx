import type { WizardPreferences } from '../../lib/projectWizard'

type PreferencesStepProps = {
  preferences: WizardPreferences
  onChange: (preferences: WizardPreferences) => void
  labels: {
    verifiedOnly: string
    companiesOnly: string
    emergency: string
    premiumOnly: string
    insuranceRequired: string
    warrantyRequired: string
    hint: string
  }
}

const OPTIONS: Array<{ key: keyof WizardPreferences; labelKey: keyof PreferencesStepProps['labels'] }> =
  [
    { key: 'verifiedOnly', labelKey: 'verifiedOnly' },
    { key: 'companiesOnly', labelKey: 'companiesOnly' },
    { key: 'emergency', labelKey: 'emergency' },
    { key: 'premiumOnly', labelKey: 'premiumOnly' },
    { key: 'insuranceRequired', labelKey: 'insuranceRequired' },
    { key: 'warrantyRequired', labelKey: 'warrantyRequired' },
  ]

export function PreferencesStep({ preferences, onChange, labels }: PreferencesStepProps) {
  return (
    <div className="space-y-3">
      <p className="text-center text-[14px] text-[#6e6e73]">{labels.hint}</p>
      {OPTIONS.map((opt) => {
        const checked = preferences[opt.key]
        return (
          <label
            key={opt.key}
            className={
              'flex cursor-pointer items-center justify-between rounded-[18px] border px-4 py-4 transition ' +
              (checked
                ? 'border-[#1d1d1f] bg-[#f5f5f7]'
                : 'border-[#e8e8ed] bg-white hover:bg-[#fafafa]')
            }
          >
            <span className="text-[15px] font-semibold text-[#1d1d1f]">{labels[opt.labelKey]}</span>
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) =>
                onChange({
                  ...preferences,
                  [opt.key]: e.target.checked,
                })
              }
              className="h-5 w-5 accent-[#1d1d1f]"
            />
          </label>
        )
      })}
    </div>
  )
}
