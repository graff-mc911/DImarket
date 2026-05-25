import type { FraudAnalysis } from '../types'

const DISPOSABLE_DOMAINS = [
  'mailinator.com',
  'guerrillamail.com',
  'tempmail.com',
  '10minutemail.com',
  'yopmail.com',
]

const SCAM_PATTERNS = [
  /wire transfer/i,
  /western union/i,
  /crypto only/i,
  /telegram.*payment/i,
  /100% prepay/i,
  /гарантія.*100%/i,
  /передоплата.*100%/i,
]

const FAKE_LINK = /bit\.ly|tinyurl|t\.me\/pay/i

export type FraudScanInput = {
  text?: string
  email?: string
  urls?: string[]
  userId?: string
  targetType: string
  targetId: string
}

export function analyzeFraudLocally(input: FraudScanInput): FraudAnalysis {
  const flags: string[] = []
  let risk = 0
  const text = (input.text || '').trim()
  const email = (input.email || '').toLowerCase()

  if (text.length > 0 && text.length < 12) {
    flags.push('very_short_text')
    risk += 8
  }

  const repeated = /(.{10,})\1{2,}/.test(text)
  if (repeated) {
    flags.push('repeated_text_pattern')
    risk += 15
  }

  for (const p of SCAM_PATTERNS) {
    if (p.test(text)) {
      flags.push('scam_phrase')
      risk += 25
      break
    }
  }

  for (const url of input.urls ?? []) {
    if (FAKE_LINK.test(url)) {
      flags.push('suspicious_link')
      risk += 20
    }
  }

  if (email) {
    const domain = email.split('@')[1]
    if (domain && DISPOSABLE_DOMAINS.some((d) => domain.includes(d))) {
      flags.push('disposable_email')
      risk += 30
    }
  }

  const capsRatio = text.replace(/[^A-ZА-ЯІЇЄҐ]/g, '').length / Math.max(text.length, 1)
  if (capsRatio > 0.5 && text.length > 20) {
    flags.push('excessive_caps')
    risk += 10
  }

  risk = Math.min(100, risk)
  const trustScore = Math.max(0, 100 - risk)

  return {
    riskScore: risk,
    trustScore,
    flags,
    moderationRecommended: risk >= 40,
    details: { textLength: text.length, emailDomain: email.split('@')[1] ?? null },
  }
}
