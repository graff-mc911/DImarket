import { useState, useRef, KeyboardEvent } from 'react'
import { Mic, Send, Square, Volume2, VolumeX } from 'lucide-react'
import { useVoiceInput } from '../../hooks/useVoiceInput'

type AdminAIInputProps = {
  onSend: (text: string) => void
  loading: boolean
  voiceOut: boolean
  onToggleVoiceOut: () => void
  onHistoryNav: (dir: 'up' | 'down') => string | null
  lang?: string
}

export function AdminAIInput({
  onSend,
  loading,
  voiceOut,
  onToggleVoiceOut,
  onHistoryNav,
  lang = 'uk-UA',
}: AdminAIInputProps) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { listening, interim, supported, start, stop } = useVoiceInput({
    lang,
    onFinal: (t) => {
      setText('')
      onSend(t)
    },
  })

  const submit = () => {
    const v = (listening ? interim : text).trim()
    if (!v || loading) return
    setText('')
    onSend(v)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
    if (e.key === 'ArrowUp' && !text) {
      e.preventDefault()
      const prev = onHistoryNav('up')
      if (prev !== null) setText(prev)
    }
    if (e.key === 'ArrowDown' && !text) {
      e.preventDefault()
      const next = onHistoryNav('down')
      if (next !== null) setText(next)
    }
  }

  return (
    <div className="shrink-0 border-t border-[rgba(148,163,184,0.25)] bg-[#27272a] p-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))]">
      {listening && interim && (
        <p className="mb-1 px-1 text-xs italic text-[#c96d2c]">{interim}</p>
      )}
      <div className="flex items-end gap-1.5">
        <textarea
          ref={inputRef}
          value={listening ? interim : text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={loading || listening}
          rows={2}
          placeholder="Команда або запит… (/stats)"
          className="min-h-[48px] flex-1 resize-none rounded-xl border-2 border-[rgba(201,109,44,0.45)] bg-white px-3 py-2.5 text-sm text-[#18181b] placeholder:text-[#78716c] focus:border-[#c96d2c] focus:outline-none focus:ring-2 focus:ring-[rgba(201,109,44,0.25)]"
        />
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onToggleVoiceOut}
            className={`rounded-lg p-2.5 ${voiceOut ? 'bg-[#c96d2c] text-white' : 'bg-[#3f3f46] text-[#e7e5e4] hover:bg-[#52525b]'}`}
            title="Озвучити відповіді"
            aria-label="Озвучити відповіді"
          >
            {voiceOut ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={listening ? stop : start}
            disabled={loading || !supported}
            className={`rounded-lg p-2.5 ${
              listening
                ? 'animate-pulse bg-[#ef4444] text-white'
                : 'bg-[#3f3f46] text-[#e7e5e4] hover:bg-[#52525b] disabled:opacity-40'
            }`}
            title={supported ? 'Голосовий ввід' : 'Голос не підтримується в цьому браузері'}
            aria-label="Мікрофон"
          >
            {listening ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={loading || (!(listening ? interim : text).trim())}
            className="rounded-lg bg-[#c96d2c] p-2.5 text-white disabled:opacity-40"
            aria-label="Надіслати"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
