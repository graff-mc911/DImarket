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

type EdgeSalesResponse = {
  replyText?: string
  replyKey?: string
  step?: SalesBotStep
  draft?: JobRequestDraft
  canPublish?: boolean
  error?: string
}

/**
 * Job-request chat turn.
 * Local engine owns step machine + draft (publish-safe).
 * Edge `sales-chat` optionally polishes the assistant reply with OpenAI when keyed.
 */
export async function runSalesChatTurn(req: SalesChatRequest): Promise<SalesChatResponse> {
  const local: SalesBotTurnResult =
    !req.message.trim() && req.step === 'welcome'
      ? getInitialTurn(req.context)
      : processSalesBotTurn(req.step, req.draft, req.message, req.context)

  // Skip LLM polish for initial welcome / publish terminal turns
  if (!req.message.trim() || local.canPublish || local.step === 'done') {
    return local
  }

  try {
    const { data, error } = await supabase.functions.invoke<EdgeSalesResponse>('sales-chat', {
      body: {
        message: req.message,
        step: req.step,
        nextStep: local.step,
        draft: local.draft,
        locale: req.locale,
        suggestedReplyKey: local.replyKey,
        suggestedParams: local.replyParams ?? {},
      },
    })

    const polished = data?.replyText?.trim()
    if (!error && polished && !data?.error) {
      return {
        ...local,
        replyText: polished,
      }
    }
  } catch {
    /* keep deterministic local turn */
  }

  return local
}
