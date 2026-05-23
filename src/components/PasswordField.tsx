import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useApp } from '../contexts/AppContext'

interface PasswordFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  minLength?: number
  hint?: string
  autoComplete?: 'current-password' | 'new-password'
}

export function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  minLength,
  hint,
  autoComplete = 'current-password',
}: PasswordFieldProps) {
  const { t } = useApp()
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[#5f5a54]">
        {label}
        {required && <span className="ml-0.5 text-[#c45a4a]">*</span>}
      </label>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          required={required}
          minLength={minLength}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="input-glass pr-11"
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={() => setShowPassword(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-400)] transition hover:text-[var(--ink-700)]"
          aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
      {hint && <p className="mt-1.5 text-xs text-[#7a7168]">{hint}</p>}
    </div>
  )
}
