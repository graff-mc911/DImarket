import { Mic, MicOff } from 'lucide-react'
import { useCallback } from 'react'
import { useVoiceInput } from '../../hooks/useVoiceInput'
import { useApp } from '../../contexts/AppContext'

const VOICE_LANG: Record<string, string> = {
  en: 'en-US',
  uk: 'uk-UA',
  ru: 'ru-RU',
  de: 'de-DE',
  pl: 'pl-PL',
  fr: 'fr-FR',
  es: 'es-ES',
  it: 'it-IT',
  pt: 'pt-PT',
}

interface VoiceSearchButtonProps {
  onResult: (text: string) => void
  className?: string
}

export function VoiceSearchButton({ onResult, className = '' }: VoiceSearchButtonProps) {
  const { language, t } = useApp()
  const voiceLang = VOICE_LANG[language.code] || 'en-US'

  const onFinal = useCallback(
    (text: string) => {
      onResult(text.trim())
    },
    [onResult],
  )

  const { listening, supported, start, stop } = useVoiceInput({
    lang: voiceLang,
    onFinal,
  })

  if (!supported) return null

  return (
    <button
      type="button"
      className={`adv-search__voice ${listening ? 'is-listening' : ''} ${className}`.trim()}
      onClick={() => (listening ? stop() : start())}
      aria-label={listening ? t('advancedSearch.stopVoice') : t('advancedSearch.voiceSearch')}
      title={listening ? t('advancedSearch.stopVoice') : t('advancedSearch.voiceSearch')}
    >
      {listening ? <MicOff className="h-4 w-4" aria-hidden /> : <Mic className="h-4 w-4" aria-hidden />}
    </button>
  )
}
