import { aiDb } from '../../ai/db'
import type { TranslationResult } from '../types'
import { invokeAiBot } from '../client'

export type TranslateInput = {
  text: string
  sourceLang: string
  targetLang: string
  sourceType: string
  sourceId: string
  fieldName?: string
}

/** Кеш у ai_translations, потім edge OpenAI, інакше оригінал */
export async function translateText(input: TranslateInput): Promise<TranslationResult> {
  const field = input.fieldName ?? 'body'

  const { data: cached } = await aiDb
    .from('ai_translations')
    .select('translated_text, fallback_used')
    .eq('source_type', input.sourceType)
    .eq('source_id', input.sourceId)
    .eq('field_name', field)
    .eq('target_lang', input.targetLang)
    .maybeSingle()

  if (cached?.translated_text) {
    return {
      originalText: input.text,
      translatedText: cached.translated_text,
      targetLang: input.targetLang,
      fallbackUsed: Boolean(cached.fallback_used),
      provider: 'cache',
    }
  }

  if (input.sourceLang === input.targetLang) {
    return {
      originalText: input.text,
      translatedText: input.text,
      targetLang: input.targetLang,
      fallbackUsed: false,
      provider: 'passthrough',
    }
  }

  const edge = await invokeAiBot<TranslationResult>({
    bot: 'translation',
    action: 'translate',
    payload: {
      text: input.text,
      sourceLang: input.sourceLang,
      targetLang: input.targetLang,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      fieldName: field,
    },
    locale: input.targetLang,
  })

  if (edge.ok && edge.data?.translatedText) {
    return edge.data
  }

  return {
    originalText: input.text,
    translatedText: input.text,
    targetLang: input.targetLang,
    fallbackUsed: true,
    provider: 'passthrough',
  }
}
