import { Sparkles } from 'lucide-react'
import { useState } from 'react'
import { improveProjectDescription } from '../../lib/wizardAiAssist'

type DescriptionStepProps = {
  value: string
  onChange: (v: string) => void
  placeholder: string
  hint: string
  tradeId?: string | null
  city?: string
  language?: string
  error?: string
  aiLabel?: string
  aiWorkingLabel?: string
}

export function DescriptionStep({
  value,
  onChange,
  placeholder,
  hint,
  tradeId,
  city,
  language,
  error,
  aiLabel = 'Help me write my project',
  aiWorkingLabel = 'Improving…',
}: DescriptionStepProps) {
  const len = value.trim().length
  const [busy, setBusy] = useState(false)
  const [aiNote, setAiNote] = useState<string | null>(null)

  const onAi = async () => {
    if (!value.trim()) {
      setAiNote('Write a few words first, then tap AI assist.')
      return
    }
    setBusy(true)
    setAiNote(null)
    try {
      const res = await improveProjectDescription({
        description: value,
        tradeId,
        city,
        language,
      })
      onChange(res.text)
      setAiNote(res.source === 'edge' ? 'AI improved your description.' : 'Description polished.')
    } catch {
      setAiNote('Could not improve text. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={9}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby="wizard-desc-hint"
        className={
          'w-full resize-y rounded-[20px] border bg-[#fafafa] px-4 py-4 text-[16px] leading-7 text-[#1d1d1f] outline-none transition placeholder:text-[#aeaeb2] focus:bg-white ' +
          (error
            ? 'border-[#c41e3a]'
            : 'border-[#e8e8ed] focus:border-[#1d1d1f] focus:shadow-[0_0_0_4px_rgba(0,0,0,0.06)]')
        }
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => void onAi()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-[#1d1d1f] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" aria-hidden />
          {busy ? aiWorkingLabel : aiLabel}
        </button>
        <p
          id="wizard-desc-hint"
          className={'text-[12px] tabular-nums ' + (len < 20 ? 'text-[#c41e3a]' : 'text-[#86868b]')}
        >
          {error || hint} · {len}/20+
        </p>
      </div>
      {aiNote ? (
        <p className="mt-2 text-[12px] font-medium text-[#067d62]" aria-live="polite">
          {aiNote}
        </p>
      ) : null}
    </div>
  )
}
