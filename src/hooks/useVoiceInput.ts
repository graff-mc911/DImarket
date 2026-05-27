import { useCallback, useEffect, useRef, useState } from 'react'

type SpeechRecognitionCtor = new () => SpeechRecognition

function getRecognition(): SpeechRecognition | null {
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition
  return SR ? new SR() : null
}

export function useVoiceInput(options: {
  lang?: string
  onFinal: (text: string) => void
  silenceMs?: number
}) {
  const { lang = 'uk-UA', onFinal, silenceMs = 2000 } = options
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [supported, setSupported] = useState(true)
  const recRef = useRef<SpeechRecognition | null>(null)
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const transcriptRef = useRef('')

  const clearSilence = () => {
    if (silenceTimer.current) clearTimeout(silenceTimer.current)
  }

  const scheduleSubmit = useCallback(() => {
    clearSilence()
    silenceTimer.current = setTimeout(() => {
      const text = transcriptRef.current.trim()
      if (text) {
        onFinal(text)
        stop()
      }
    }, silenceMs)
  }, [onFinal, silenceMs])

  const stop = useCallback(() => {
    clearSilence()
    recRef.current?.stop()
    setListening(false)
    setInterim('')
    transcriptRef.current = ''
  }, [])

  const start = useCallback(() => {
    const rec = getRecognition()
    if (!rec) {
      setSupported(false)
      return
    }
    rec.lang = lang
    rec.continuous = false
    rec.interimResults = true
    rec.onresult = (ev: SpeechRecognitionEvent) => {
      let final = ''
      let interimText = ''
      for (let i = 0; i < ev.results.length; i++) {
        const r = ev.results[i]
        if (r.isFinal) final += r[0].transcript
        else interimText += r[0].transcript
      }
      if (final) {
        transcriptRef.current = final
        setInterim(final)
        scheduleSubmit()
      } else {
        setInterim(interimText)
        transcriptRef.current = interimText
        scheduleSubmit()
      }
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recRef.current = rec
    rec.start()
    setListening(true)
  }, [lang, scheduleSubmit])

  useEffect(() => () => {
    clearSilence()
    recRef.current?.abort()
  }, [])

  return { listening, interim, supported, start, stop }
}

export function speakText(text: string, lang = 'uk-UA') {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text.replace(/[*#]/g, ''))
  u.lang = lang
  window.speechSynthesis.speak(u)
}

export function stopSpeaking() {
  window.speechSynthesis?.cancel()
}
