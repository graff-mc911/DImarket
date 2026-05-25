import type { JobRequestDraft } from '../../ai/jobRequestDraft'

export type LeadQualification = {
  leadQualityScore: number
  isSerious: boolean
  missingFields: string[]
  suggestedQuestions: string[]
}

export function qualifyLeadLocally(draft: JobRequestDraft): LeadQualification {
  const missing: string[] = []
  const questions: string[] = []

  if (!draft.categoryId && !draft.categorySlug) {
    missing.push('category')
    questions.push('ai.lead.askCategory')
  }
  if (!draft.location?.trim()) {
    missing.push('location')
    questions.push('ai.lead.askCity')
  }
  if (!draft.description || draft.description.trim().length < 20) {
    missing.push('description')
    questions.push('ai.lead.askDescription')
  }
  if (draft.price == null) {
    missing.push('budget')
    questions.push('ai.lead.askBudget')
  }
  if (!draft.deadlineDays) {
    missing.push('deadline')
    questions.push('ai.lead.askDeadline')
  }
  if (!draft.contactPhone && !draft.contactEmail) {
    missing.push('contact')
    questions.push('ai.lead.askContact')
  }

  let score = 100 - missing.length * 14
  const descLen = draft.description?.trim().length ?? 0
  if (descLen >= 80) score += 10
  if (descLen >= 200) score += 5
  if ((draft.imageUrls?.length ?? 0) > 0) score += 8

  score = Math.max(0, Math.min(100, score))
  const isSerious = score >= 55 && missing.length <= 2

  return {
    leadQualityScore: score,
    isSerious,
    missingFields: missing,
    suggestedQuestions: questions,
  }
}
