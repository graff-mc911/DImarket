import { supabase } from '../supabase'

export type MarketingAgentAction =
  | 'status'
  | 'get_config'
  | 'update_config'
  | 'list_posts'
  | 'approve_post'
  | 'reject_post'
  | 'generate_preview'
  | 'run_cycle'
  | 'publish_post'
  | 'analytics_summary'

export type MarketingPlatform =
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'twitter'
  | 'linkedin'
  | 'pinterest'
  | 'youtube'
  | 'telegram'
  | 'whatsapp'
  | 'viber'
  | 'google_ads'
  | 'google_business'
  | 'reddit'
  | 'quora'
  | 'email'
  | 'blog'

export type MarketTarget = {
  countryCode: string
  languageCode: string
  label: string
}

export type AgentConfig = {
  id: string
  is_running: boolean
  target_markets: MarketTarget[]
  platforms: MarketingPlatform[]
  frequency: 'hourly' | 'daily' | 'weekly'
  auto_publish: boolean
  daily_budget_usd: number
  ab_testing_enabled: boolean
  last_run_at: string | null
  next_role_index: number
}

export type MarketingPost = {
  id: string
  role_target: string
  platform: string
  country_code: string
  language_code: string
  body: string
  hashtags: string[]
  status: string
  image_url?: string | null
  llm_provider?: string | null
  created_at: string
}

const FN = 'marketing-agent'

async function invoke<T>(action: MarketingAgentAction, payload?: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke<{ ok: boolean; data?: T; error?: string }>(
    FN,
    { body: { action, payload } },
  )
  if (error) throw error
  if (!data?.ok) throw new Error(data?.error ?? 'marketing_agent_error')
  return data.data as T
}

export const marketingAgentApi = {
  status: () => invoke<Record<string, boolean>>('status'),
  getConfig: () => invoke<AgentConfig>('get_config'),
  updateConfig: (patch: Partial<AgentConfig>) => invoke<AgentConfig>('update_config', patch),
  listPosts: (status?: string) => invoke<MarketingPost[]>('list_posts', status ? { status } : {}),
  approvePost: (postId: string) => invoke<void>('approve_post', { postId }),
  rejectPost: (postId: string) => invoke<void>('reject_post', { postId }),
  generatePreview: (params: {
    role: string
    platform: string
    languageCode: string
    countryCode: string
  }) => invoke<{ body: string; hashtags: string[]; title?: string; imagePrompt?: string; provider: string }>(
    'generate_preview',
    params,
  ),
  runCycle: () => invoke<{ created: number }>('run_cycle'),
  publishPost: (postId: string) => invoke<{ success: boolean; externalId?: string }>('publish_post', { postId }),
  analytics: () =>
    invoke<{
      postsPublished: number
      pendingReview: number
      attributedRegistrations: number
      recentEvents: unknown[]
    }>('analytics_summary'),
}

/** Fire-and-forget after registration */
export function triggerRegistrationMarketing(payload: {
  userId: string
  userRole: string
  languageCode?: string
  countryCode?: string
}) {
  void supabase.functions
    .invoke(FN, {
      body: {
        action: 'registration_webhook',
        payload: {
          userId: payload.userId,
          userRole: payload.userRole,
          languageCode: payload.languageCode ?? 'uk',
          countryCode: payload.countryCode ?? 'UA',
        },
      },
    })
    .catch(() => {})
}
