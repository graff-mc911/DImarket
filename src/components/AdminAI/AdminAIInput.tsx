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
    <div className="border-t border-[rgba(148,163,184,0.15)] p-2">
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
          className="min-h-[44px] flex-1 resize-none rounded-xl border border-[rgba(148,163,184,0.2)] bg-[rgba(24,24,27,0.9)] px-3 py-2 text-sm text-[#fafaf9] placeholder:text-[#78716c] focus:border-[#c96d2c] focus:outline-none"
        />
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={onToggleVoiceOut}
            className={`rounded-lg p-2 ${voiceOut ? 'bg-[#c96d2c] text-white' : 'text-[#a8a29e] hover:bg-[rgba(63,63,70,0.8)]'}`}
            title="Озвучити відповіді"
          >
            {voiceOut ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          {supported && (
            <button
              type="button"
              onClick={listening ? stop : start}
              disabled={loading}
              className={`rounded-lg p-2 ${
                listening
                  ? 'animate-pulse bg-[#ef4444] text-white'
                  : 'text-[#a8a29e] hover:bg-[rgba(63,63,70,0.8)]'
              }`}
              title="Голосовий ввід"
            >
              {listening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={loading || (!(listening ? interim : text).trim())}
            className="rounded-lg bg-[#c96d2c] p-2 text-white disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
