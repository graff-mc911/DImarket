/** Shared marketing agent types */

export type DiMarketRole = 'client' | 'master' | 'company' | 'advertiser'

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

export type PostFrequency = 'hourly' | 'daily' | 'weekly'

export type PostStatus = 'draft' | 'pending_review' | 'approved' | 'scheduled' | 'published' | 'failed'

export type ContentKind =
  | 'social_post'
  | 'video_script'
  | 'banner_copy'
  | 'email'
  | 'seo_article'
  | 'influencer_dm'
  | 'comment_reply'

export interface MarketTarget {
  countryCode: string
  languageCode: string
  label: string
}

export interface AgentConfig {
  id: string
  is_running: boolean
  target_markets: MarketTarget[]
  platforms: MarketingPlatform[]
  frequency: PostFrequency
  auto_publish: boolean
  daily_budget_usd: number
  ab_testing_enabled: boolean
  last_run_at: string | null
  next_role_index: number
  updated_at: string
}

export interface GeneratedContent {
  role: DiMarketRole
  platform: MarketingPlatform
  languageCode: string
  countryCode: string
  kind: ContentKind
  title?: string
  body: string
  hashtags: string[]
  imagePrompt?: string
  charCount: number
  metadata?: Record<string, unknown>
}

export interface PublishResult {
  platform: MarketingPlatform
  success: boolean
  externalId?: string
  error?: string
  skipped?: boolean
}

export interface CampaignMetrics {
  impressions: number
  clicks: number
  conversions: number
  spend_usd: number
}
