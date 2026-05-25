export type ReviewAnalysis = {
  sentiment: 'positive' | 'neutral' | 'negative'
  riskScore: number
  moderationFlag: boolean
  flags: string[]
}

const NEGATIVE = [
  'scam',
  'fraud',
  'terrible',
  'awful',
  'жах',
  'шахрай',
  'обман',
  'кинули',
  'не рекомендую',
]

export function analyzeReviewLocally(text: string, rating?: number): ReviewAnalysis {
  const lower = text.toLowerCase()
  const flags: string[] = []
  let risk = 0

  for (const w of NEGATIVE) {
    if (lower.includes(w)) {
      flags.push('negative_keyword')
      risk += 25
      break
    }
  }

  if (rating !== undefined && rating <= 2) {
    flags.push('low_rating')
    risk += 15
  }

  const words = lower.split(/\s+/)
  const unique = new Set(words)
  if (words.length > 8 && unique.size < words.length * 0.4) {
    flags.push('repetitive_review')
    risk += 20
  }

  if (text.length < 8) {
    flags.push('too_short')
    risk += 10
  }

  let sentiment: ReviewAnalysis['sentiment'] = 'neutral'
  if (rating && rating >= 4) sentiment = 'positive'
  else if (rating && rating <= 2) sentiment = 'negative'
  else if (risk >= 20) sentiment = 'negative'

  risk = Math.min(100, risk)

  return {
    sentiment,
    riskScore: risk,
    moderationFlag: risk >= 35,
    flags,
  }
}
