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
 * Edge `sales-chat` optionally polishes replyText — but NOT on diagnostic /
 * structural guide steps (LLM must not invent "pick a category").
 */
export async function runSalesChatTurn(req: SalesChatRequest): Promise<SalesChatResponse> {
  const local: SalesBotTurnResult =
    !req.message.trim() && (req.step === 'welcome' || !req.step)
      ? getInitialTurn(req.context)
      : processSalesBotTurn(req.step, req.draft, req.message, req.context)

  // Skip LLM polish for initial welcome / publish terminal turns / diagnostics
  const skipPolish =
    !req.message.trim() ||
    local.canPublish ||
    local.step === 'done' ||
    local.needsMatches ||
    local.navigateTo ||
    SKIP_POLISH_STEPS.has(local.step) ||
    SKIP_POLISH_STEPS.has(req.step)

  if (skipPolish) {
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
        suggestedReplyText: local.replyText,
      },
    })

    const polished = data?.replyText?.trim()
    if (!error && polished && !data?.error) {
      // Reject polish that re-asks for category when we already diagnosed
      const badCategoryAsk =
        /категор|category|яка послуга|what service/i.test(polished) &&
        Boolean(local.draft.problemText || local.draft.tradeRole || local.draft.categorySlug)
      if (badCategoryAsk) return local

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

const SKIP_POLISH_STEPS = new Set<SalesBotStep>([
  'welcome',
  'diagnose_duration',
  'diagnose_symptoms',
  'trade_confirm',
  'geo',
  'show_matches',
  'ask_publish',
  'ad_goal',
  'ad_geo',
  'ad_budget',
  'ad_ready',
  'profile_name',
  'profile_city',
  'profile_trade',
  'profile_phone',
  'profile_ready',
  'vacancy_title',
  'vacancy_city',
  'vacancy_salary',
  'vacancy_desc',
  'vacancy_confirm',
  'sell_mode',
  'sell_what',
  'sell_city',
  'sell_price',
  'sell_desc',
  'sell_confirm',
])

