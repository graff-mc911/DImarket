import { useCallback, useRef, useState } from 'react'
import { Mic, Square } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'

type VoiceRecorderProps = {
  onTranscript: (text: string) => void
  disabled?: boolean
}

/** Запис голосу → текст (Web Speech API, без ключів API). */
export function VoiceRecorder({ onTranscript, disabled }: VoiceRecorderProps) {
  const { t } = useApp()
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(true)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setSupported(false)
      return
    }
    const rec = new SR()
    rec.lang = document.documentElement.lang || 'uk-UA'
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.onresult = (ev: SpeechRecognitionEvent) => {
      const text = ev.results[0]?.[0]?.transcript?.trim()
      if (text) onTranscript(text)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recognitionRef.current = rec
    rec.start()
    setListening(true)
  }, [onTranscript])

  const stop = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  if (!supported) {
    return (
      <p className="text-[11px] text-[#9a8776]">{t('ai.voice.unsupported')}</p>
    )
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={listening ? stop : start}
      className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
        listening
          ? 'bg-[#ef4444] text-white'
          : 'border border-[rgba(99,102,241,0.35)] text-[#6366f1]'
      } disabled:opacity-50`}
    >
      {listening ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
      {listening ? t('ai.voice.stop') : t('ai.voice.start')}
    </button>
  )
}
