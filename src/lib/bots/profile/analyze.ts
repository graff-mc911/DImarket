import type { Profile } from '../../types'

export type ProfileSuggestion = {
  field: string
  priority: 'high' | 'medium' | 'low'
  messageKey: string
}

export type ProfileAnalysis = {
  profileQualityScore: number
  suggestions: ProfileSuggestion[]
}

export function analyzeProfileLocally(profile: Partial<Profile>): ProfileAnalysis {
  const suggestions: ProfileSuggestion[] = []
  let score = 100

  if (!profile.bio || profile.bio.trim().length < 40) {
    score -= 15
    suggestions.push({ field: 'bio', priority: 'high', messageKey: 'ai.profile.suggestBio' })
  }
  if (!profile.profile_photo && !profile.avatar_url) {
    score -= 20
    suggestions.push({ field: 'photo', priority: 'high', messageKey: 'ai.profile.suggestPhoto' })
  }
  if (!profile.location?.trim()) {
    score -= 10
    suggestions.push({ field: 'location', priority: 'medium', messageKey: 'ai.profile.suggestLocation' })
  }
  if ((profile.response_rate ?? 0) < 50) {
    score -= 8
    suggestions.push({ field: 'response', priority: 'medium', messageKey: 'ai.profile.suggestResponse' })
  }
  if (!profile.portfolio_images?.length) {
    score -= 12
    suggestions.push({ field: 'portfolio', priority: 'medium', messageKey: 'ai.profile.suggestPortfolio' })
  }
  if (!profile.is_verified) {
    score -= 5
    suggestions.push({ field: 'verify', priority: 'low', messageKey: 'ai.profile.suggestVerify' })
  }

  return {
    profileQualityScore: Math.max(0, Math.min(100, score)),
    suggestions,
  }
}
