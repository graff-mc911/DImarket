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
  quickReplies?: string[]
  error?: string
}

/** Structural steps — keep local copy, no free-form LLM rewrite. */
const SKIP_POLISH_STEPS = new Set<SalesBotStep>([
  'welcome',
  'trade_confirm',
  'renovation_choice',
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
  'confirm',
  'contact',
  'done',
])

/**
 * Job-request chat turn.
 * Local engine owns step/draft. For diagnose_symptoms, LLM may refine the
 * NEXT question to match the actual problem (AC ≠ power outage template).
 */
export async function runSalesChatTurn(req: SalesChatRequest): Promise<SalesChatResponse> {
  const local: SalesBotTurnResult =
    !req.message.trim() && (req.step === 'welcome' || !req.step)
      ? getInitialTurn(req.context)
      : processSalesBotTurn(req.step, req.draft, req.message, req.context)

  const skipPolish =
    !req.message.trim() ||
    local.canPublish ||
    local.step === 'done' ||
    local.needsMatches ||
    Boolean(local.navigateTo) ||
    SKIP_POLISH_STEPS.has(local.step)

  // After duration answer → next is diagnose_symptoms: ask LLM for a problem-specific question
  const wantsDiagnoseLlm =
    local.step === 'diagnose_symptoms' &&
    Boolean(local.draft.problemText) &&
    req.step === 'diagnose_duration'

  if (skipPolish && !wantsDiagnoseLlm) {
    return local
  }

  try {
    const { data, error } = await supabase.functions.invoke<EdgeSalesResponse>('sales-chat', {
      body: {
        mode: wantsDiagnoseLlm ? 'diagnose' : 'polish',
        message: req.message,
        step: req.step,
        nextStep: local.step,
        draft: local.draft,
        locale: req.locale,
        suggestedReplyKey: local.replyKey,
        suggestedParams: local.replyParams ?? {},
        suggestedReplyText: local.replyText,
        suggestedQuickReplies: local.quickReplies ?? [],
      },
    })

    const polished = data?.replyText?.trim()
    if (!error && polished && !data?.error) {
      const badCategoryAsk =
        /категор|category|яка послуга|what service/i.test(polished) &&
        Boolean(local.draft.problemText || local.draft.tradeRole || local.draft.categorySlug)
      if (badCategoryAsk) return local

      // Diagnose mode must stay on-topic for AC / plumbing / etc.
      if (wantsDiagnoseLlm) {
        const kind = local.draft.problemKind || ''
        if (kind === 'ac_cooling' && /(автомат|щиток|темно в одній|вибивало)/i.test(polished)) {
          return local
        }
        if (kind === 'plumbing' && /(автомат|іскри|темно)/i.test(polished)) {
          return local
        }
      }

      return {
        ...local,
        replyText: polished,
        quickReplies:
          Array.isArray(data.quickReplies) && data.quickReplies.length
            ? data.quickReplies.map(String)
            : local.quickReplies,
      }
    }
  } catch {
    /* keep deterministic local turn */
  }

  return local
}
