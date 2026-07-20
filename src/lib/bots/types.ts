/** Типи AI-платформи Dimarket */

export type BotId =
  | 'sales'
  | 'matching'
  | 'translation'
  | 'fraud'
  | 'quote'
  | 'ocr'
  | 'profile'
  | 'review'
  | 'lead'
  | 'voice'
  | 'messaging'
  | 'ad_image'

export type AiTaskStatus = 'pending' | 'running' | 'completed' | 'failed'

export type AiRouterRequest = {
  bot: BotId
  action: string
  payload?: Record<string, unknown>
  conversationId?: string
  locale?: string
}

export type AiRouterResponse<T = unknown> = {
  ok: boolean
  data?: T
  error?: string
  fallback?: boolean
  taskId?: string
}

export type MatchScoreBreakdown = {
  distance: number
  specialization: number
  rating: number
  completedJobs: number
  languages: number
  availability: number
  verification: number
  portfolio: number
}

export type RankedMatch = {
  profileId: string
  fullName: string
  location: string | null
  rating: number
  totalReviews: number
  responseRate: number | null
  score: number
  reasons: string[]
  breakdown?: MatchScoreBreakdown
  distanceKm?: number | null
  verificationLevel?: 'none' | 'bronze' | 'silver' | 'gold' | null
  avatarUrl?: string | null
  completedJobs?: number
  availabilityStatus?: string
}

export type TranslationResult = {
  originalText: string
  translatedText: string
  targetLang: string
  fallbackUsed: boolean
  provider: 'openai' | 'passthrough' | 'cache'
}

export type FraudAnalysis = {
  riskScore: number
  trustScore: number
  flags: string[]
  moderationRecommended: boolean
  details: Record<string, unknown>
}

export type QuoteEstimate = {
  minPrice: number
  maxPrice: number
  currency: string
  explanation: string
  confidence: number
}

export type OcrExtracted = {
  companyName?: string
  invoiceDate?: string
  vatNumber?: string
  totalAmount?: number
  currency?: string
  invoiceNumber?: string
}

export type AdImageVariantKey = 'desktop_wide' | 'sidebar' | 'mobile_square' | 'card'

export type AdImageVariantSpec = {
  key: AdImageVariantKey
  width: number
  height: number
  labelKey: string
}

export const AD_IMAGE_VARIANTS: AdImageVariantSpec[] = [
  { key: 'desktop_wide', width: 1200, height: 300, labelKey: 'ai.adImage.variant.desktop' },
  { key: 'sidebar', width: 300, height: 600, labelKey: 'ai.adImage.variant.sidebar' },
  { key: 'mobile_square', width: 1080, height: 1080, labelKey: 'ai.adImage.variant.mobile' },
  { key: 'card', width: 600, height: 400, labelKey: 'ai.adImage.variant.card' },
]

export type AdImageAssetStatus =
  | 'original_uploaded'
  | 'processing'
  | 'ready'
  | 'failed'
