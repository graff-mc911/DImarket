import {
  FolderTree,
  FileText,
  Receipt,
  ScrollText,
  Sparkles,
  MessagesSquare,
  UserRound,
  Calculator,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react'
import { supabase } from '../supabase'
import { analyzeProfileLocally } from '../bots/profile/analyze'
import { estimateCostLocally } from '../costEstimator'
import { PROJECT_TRADES } from '../projectWizard'
import { fetchMessages } from '../chat/messages'
import { fetchConversationsForUser } from '../chat/conversations'
import type { Profile } from '../types'

export type AssistantAudience = 'customer' | 'professional'

export type AssistantToolId =
  | 'create_project'
  | 'estimate_budget'
  | 'choose_category'
  | 'generate_quote'
  | 'generate_invoice'
  | 'write_proposal'
  | 'write_contract'
  | 'summarize_chat'
  | 'improve_profile'

export type AssistantTool = {
  id: AssistantToolId
  audience: AssistantAudience
  title: string
  description: string
  icon: LucideIcon
  href?: string
  needsAuth?: boolean
}

export const ASSISTANT_TOOLS: AssistantTool[] = [
  {
    id: 'create_project',
    audience: 'customer',
    title: 'Describe a problem',
    description: 'No light, leak, ads, vacancy, sell… AI asks what is missing and helps publish.',
    icon: ClipboardList,
    href: '/assistant/job',
  },
  {
    id: 'estimate_budget',
    audience: 'customer',
    title: 'Estimate budget',
    description: 'Get a Low–High EUR range for your renovation or repair.',
    icon: Calculator,
  },
  {
    id: 'choose_category',
    audience: 'customer',
    title: 'Choose category',
    description: 'Describe the job and let AI pick the best trade category.',
    icon: FolderTree,
  },
  {
    id: 'generate_quote',
    audience: 'professional',
    title: 'Generate quote',
    description: 'Draft a professional quote from the job description.',
    icon: FileText,
    needsAuth: true,
  },
  {
    id: 'generate_invoice',
    audience: 'professional',
    title: 'Generate invoice',
    description: 'Create a simple invoice draft ready to send.',
    icon: Receipt,
    needsAuth: true,
  },
  {
    id: 'write_proposal',
    audience: 'professional',
    title: 'Write proposal',
    description: 'Win the job with a clear, persuasive proposal.',
    icon: Sparkles,
    needsAuth: true,
  },
  {
    id: 'write_contract',
    audience: 'professional',
    title: 'Write contract',
    description: 'Generate a service agreement template (not legal advice).',
    icon: ScrollText,
    needsAuth: true,
  },
  {
    id: 'summarize_chat',
    audience: 'professional',
    title: 'Summarize chat',
    description: 'Turn a conversation into decisions and next steps.',
    icon: MessagesSquare,
    needsAuth: true,
  },
  {
    id: 'improve_profile',
    audience: 'professional',
    title: 'Improve profile',
    description: 'Score your profile and rewrite a stronger bio.',
    icon: UserRound,
    needsAuth: true,
  },
]

export function toolsForAudience(audience: AssistantAudience) {
  return ASSISTANT_TOOLS.filter((t) => t.audience === audience)
}

export type AssistantRunInput = {
  tool: AssistantToolId
  locale?: string
  description?: string
  trade?: string
  city?: string
  areaSqm?: number
  jobTitle?: string
  clientName?: string
  proName?: string
  budget?: string
  extra?: string
  conversationId?: string
  transcript?: string
  profile?: Partial<Profile> | null
}

export type AssistantRunResult = {
  ok: boolean
  text: string
  data?: Record<string, unknown>
  fallback?: boolean
  error?: string
}

export async function runAssistantTool(input: AssistantRunInput): Promise<AssistantRunResult> {
  if (input.tool === 'create_project') {
    return { ok: true, text: 'Open Create project to continue.' }
  }

  let transcript = input.transcript || ''
  if (input.tool === 'summarize_chat' && input.conversationId && !transcript) {
    const rows = await fetchMessages(input.conversationId)
    transcript = rows
      .map((m) => `${m.sender_name || m.sender_id?.slice(0, 6) || 'user'}: ${m.content || ''}`)
      .join('\n')
  }

  let qualityScore = 0
  if (input.tool === 'improve_profile' && input.profile) {
    qualityScore = analyzeProfileLocally(input.profile).profileQualityScore
  }

  const payload: Record<string, unknown> = {
    description: input.description || '',
    trade: input.trade || '',
    category: input.trade || '',
    city: input.city || '',
    areaSqm: input.areaSqm || 0,
    jobTitle: input.jobTitle || '',
    clientName: input.clientName || '',
    proName: input.proName || input.profile?.full_name || '',
    budget: input.budget || '',
    extra: input.extra || '',
    transcript,
    fullName: input.profile?.full_name || '',
    bio: input.profile?.bio || '',
    location: input.profile?.location || '',
    qualityScore,
  }

  try {
    const { data, error } = await supabase.functions.invoke('ai-assistant', {
      body: {
        tool: input.tool,
        locale: input.locale || 'en',
        payload,
      },
    })

    if (!error && data?.ok && data?.data) {
      return {
        ok: true,
        text: String(data.data.text || JSON.stringify(data.data, null, 2)),
        data: data.data as Record<string, unknown>,
        fallback: Boolean(data.fallback),
      }
    }
  } catch (e) {
    console.error('runAssistantTool edge:', e)
  }

  return localFallback(input, transcript)
}

function localFallback(input: AssistantRunInput, transcript: string): AssistantRunResult {
  switch (input.tool) {
    case 'estimate_budget': {
      const tradeId =
        PROJECT_TRADES.find((t) => t.id === input.trade)?.id ||
        PROJECT_TRADES.find((t) => t.labelEn.toLowerCase() === (input.trade || '').toLowerCase())
          ?.id ||
        'general'
      const est = estimateCostLocally({
        description: input.description || 'General works',
        tradeId,
        city: input.city || '',
        areaSqm: input.areaSqm || 1,
      })
      return {
        ok: true,
        fallback: true,
        text: `${est.explanation}\n\nLow: €${est.lowPrice}\nAverage: €${est.averagePrice}\nPremium: €${est.premiumPrice}\nConfidence: ${est.confidence}%`,
        data: est as unknown as Record<string, unknown>,
      }
    }
    case 'choose_category': {
      const lower = (input.description || '').toLowerCase()
      const hit =
        PROJECT_TRADES.find(
          (t) => lower.includes(t.id) || lower.includes(t.labelEn.toLowerCase()),
        ) || PROJECT_TRADES.find((t) => t.id === 'general')!
      return {
        ok: true,
        fallback: true,
        text: `Suggested category: ${hit.labelEn} (${hit.id})`,
        data: { category: hit.id, label: hit.labelEn },
      }
    }
    case 'improve_profile': {
      const analysis = analyzeProfileLocally(input.profile || {})
      const tips = analysis.suggestions.map((s) => `• ${s.field} (${s.priority})`).join('\n')
      return {
        ok: true,
        fallback: true,
        text: `Profile score: ${analysis.profileQualityScore}/100\n\nSuggestions:\n${tips || '• Looking good'}\n\nImproved bio draft:\n${
          input.profile?.bio ||
          'Add a 2–3 sentence bio with your trade, city, and typical projects.'
        }`,
        data: { qualityScore: analysis.profileQualityScore },
      }
    }
    case 'summarize_chat': {
      const lines = transcript.split('\n').filter(Boolean)
      return {
        ok: true,
        fallback: true,
        text: `Offline summary\n• Messages: ${lines.length}\n• Preview:\n${lines.slice(0, 6).join('\n')}\n• Next: confirm scope, price, date.`,
      }
    }
    default:
      return {
        ok: true,
        fallback: true,
        text: `Draft (${input.tool})\n\n${input.jobTitle || 'Job'}\n${input.description || ''}\n\n— Generated offline. Connect OpenAI for richer results.`,
      }
  }
}

export async function listMyConversations(userId: string) {
  try {
    const rows = await fetchConversationsForUser(userId)
    return rows.map((c) => ({
      id: c.id,
      label: c.listing_title || c.other_user_name || c.id.slice(0, 8),
      updated_at: c.last_message_at,
    }))
  } catch {
    return []
  }
}
