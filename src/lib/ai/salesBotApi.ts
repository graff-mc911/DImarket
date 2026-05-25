import { supabase } from '../supabase'
import type { JobRequestDraft, SalesBotStep } from './jobRequestDraft'
import {
  getInitialTurn,
  processSalesBotTurn,
  type SalesBotContext,
  type SalesBotTurnResult,
} from './salesBotEngine'

export type SalesChatRequest = {
  message: string
  step: SalesBotStep
  draft: JobRequestDraft
  locale: string
  context: SalesBotContext
}

export type SalesChatResponse = SalesBotTurnResult

/** Виклик edge-функції з fallback на локальний движок. */
export async function runSalesChatTurn(req: SalesChatRequest): Promise<SalesChatResponse> {
  try {
    const { data, error } = await supabase.functions.invoke<SalesChatResponse>('sales-chat', {
      body: {
        message: req.message,
        step: req.step,
        draft: req.draft,
        locale: req.locale,
      },
    })
    if (!error && data?.step && !('error' in data)) {
      return { ...data, draft: data.draft ?? req.draft }
    }
  } catch {
    /* локальний fallback */
  }

  if (!req.message.trim() && req.step === 'welcome') {
    return getInitialTurn(req.context)
  }

  return processSalesBotTurn(req.step, req.draft, req.message, req.context)
}
