import { useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import {
  invokeAiBot,
  rankProfessionals,
  estimateQuoteLocally,
  analyzeFraudLocally,
  qualifyLeadLocally,
  type BotId,
} from '../../lib/bots'
import type { JobRequestDraft } from '../../lib/ai/jobRequestDraft'
import { VoiceRecorder } from './VoiceRecorder'

type AiBotPanelProps = {
  botId: BotId
  onClose?: () => void
}

/** Універсальна панель інструментів AI-бота */
export function AiBotPanel({ botId }: AiBotPanelProps) {
  const { t, language, user } = useApp()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string>('')

  const [city, setCity] = useState('')
  const [category, setCategory] = useState('construction')
  const [text, setText] = useState('')

  const run = async () => {
    setLoading(true)
    setError(null)
    try {
      switch (botId) {
        case 'matching': {
          const matches = await rankProfessionals({
            city,
            categorySlug: category,
            language: language.code,
          })
          setResult(
            matches.length
              ? matches.map((m, i) => `${i + 1}. ${m.fullName} (${m.score}) — ${m.location}`).join('\n')
              : t('ai.matching.empty'),
          )
          break
        }
        case 'quote': {
          const q = estimateQuoteLocally({
            categorySlug: category,
            city,
            description: text,
            currency: 'EUR',
          })
          setResult(`${q.minPrice}–${q.maxPrice} ${q.currency}\n${q.explanation}\n${t('ai.quote.confidence')}: ${q.confidence}%`)
          break
        }
        case 'fraud': {
          const local = analyzeFraudLocally({
            text,
            targetType: 'manual',
            targetId: 'scan',
          })
          const edge = await invokeAiBot({
            bot: 'fraud',
            action: 'scan',
            payload: { text, targetType: 'manual', targetId: 'scan' },
          })
          const f = edge.ok && edge.data ? (edge.data as typeof local) : local
          setResult(`risk: ${f.riskScore}, trust: ${f.trustScore}\n${f.flags.join(', ')}`)
          break
        }
        case 'lead': {
          const draft: JobRequestDraft = {
            description: text,
            location: city,
            categorySlug: category,
          }
          const q = qualifyLeadLocally(draft)
          setResult(
            `${t('ai.lead.score')}: ${q.leadQualityScore}\n${t('ai.lead.serious')}: ${q.isSerious ? '✓' : '—'}\n${q.missingFields.join(', ')}`,
          )
          break
        }
        case 'translation': {
          const res = await invokeAiBot({
            bot: 'translation',
            action: 'translate',
            payload: {
              text,
              sourceLang: 'uk',
              targetLang: language.code === 'uk' ? 'en' : language.code,
              sourceType: 'manual',
              sourceId: user?.id ?? 'anon',
            },
            locale: language.code,
          })
          if (res.ok && res.data) {
            const d = res.data as { translatedText: string; fallbackUsed: boolean }
            setResult(d.translatedText + (d.fallbackUsed ? `\n(${t('ai.fallback')})` : ''))
          } else setResult(text)
          break
        }
        default:
          setResult(t('ai.panel.useDedicatedPage'))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('ai.errorGeneric'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3 p-4">
      <p className="text-sm font-bold text-[#2f2a24]">{t(`ai.bot.${botId}`)}</p>

      {(botId === 'matching' || botId === 'quote' || botId === 'lead') && (
        <>
          <input
            className="input-glass w-full text-sm"
            placeholder={t('ai.field.city')}
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <input
            className="input-glass w-full text-sm"
            placeholder={t('ai.field.category')}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </>
      )}

      {(botId === 'fraud' || botId === 'quote' || botId === 'lead' || botId === 'translation') && (
        <textarea
          className="input-glass min-h-[80px] w-full text-sm"
          placeholder={t('ai.field.text')}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      )}

      {botId === 'voice' && (
        <VoiceRecorder
          onTranscript={(tr) => {
            setText(tr)
            setResult(tr)
          }}
        />
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void run()}
          disabled={loading}
          className="btn-primary flex flex-1 items-center justify-center gap-2 rounded-full py-2 text-sm disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {t('ai.run')}
        </button>
      </div>

      {error && <p className="text-xs text-[#c45a4a]">{error}</p>}
      {result && (
        <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-[12px] bg-[rgba(0,0,0,0.04)] p-3 text-xs text-[#5f5a54]">
          {result}
        </pre>
      )}
    </div>
  )
}
