/**
 * AI Analyst — missing data + clarifying questions before estimate / publish.
 * Reuses estimator + wizard state; no parallel intake system.
 */
import type { EstimatorState } from './costEstimatorTypes'

export type AnalystQuestion = {
  id: string
  field: string
  question: string
  hint?: string
  required: boolean
}

export type AnalystResult = {
  workHints: string[]
  missing: AnalystQuestion[]
  answered: Record<string, string>
  readyForEstimate: boolean
}

/** Detect clarifying questions from description + measurements + files. */
export function buildAnalystQuestions(
  state: Pick<
    EstimatorState,
    'projectTypeId' | 'description' | 'measurements' | 'files' | 'location'
  >,
  priorAnswers: Record<string, string> = {},
): AnalystResult {
  const d = state.description.toLowerCase()
  const missing: AnalystQuestion[] = []
  const workHints: string[] = []

  if (state.projectTypeId) workHints.push(`Type: ${state.projectTypeId}`)
  if (/demolish|remove|знес|демонт/i.test(d)) workHints.push('Demolition')
  if (/plumb|сантех|wasser/i.test(d)) workHints.push('Plumbing')
  if (/electr|електр/i.test(d)) workHints.push('Electrical')
  if (/tile|плитк|fliesen/i.test(d)) workHints.push('Tiling')
  if (/paint|маляр|streichen/i.test(d)) workHints.push('Painting')
  if (/floor|підлог|boden/i.test(d)) workHints.push('Flooring')
  if (/waterproof|гідроізол/i.test(d)) workHints.push('Waterproofing')

  if (!(state.measurements.areaSqm > 0) && !priorAnswers.area) {
    missing.push({
      id: 'q-area',
      field: 'area',
      question: 'What is the approximate area in m²?',
      hint: 'Even a rough number improves the estimate.',
      required: true,
    })
  }

  if (!state.location.city && !priorAnswers.city) {
    missing.push({
      id: 'q-city',
      field: 'city',
      question: 'Which city is the project in?',
      required: true,
    })
  }

  if (
    state.files.filter((f) => f.kind === 'photo').length < 1 &&
    !priorAnswers.photos_ok
  ) {
    missing.push({
      id: 'q-photos',
      field: 'photos_ok',
      question: 'Can you add at least one photo of the space?',
      hint: 'Reply "later" to skip for now.',
      required: false,
    })
  }

  if (
    !/budget|€|eur|грн|бюджет|до \d/i.test(d) &&
    !priorAnswers.budget_hint
  ) {
    missing.push({
      id: 'q-budget',
      field: 'budget_hint',
      question: 'Do you have a target budget range?',
      hint: 'e.g. 3000–5000 EUR — optional but helps matching.',
      required: false,
    })
  }

  if (
    !/deadline|by |до |asap|urgent|термін/i.test(d) &&
    !priorAnswers.deadline_hint
  ) {
    missing.push({
      id: 'q-deadline',
      field: 'deadline_hint',
      question: 'When do you need the work finished?',
      hint: 'Flexible / ASAP / specific date.',
      required: false,
    })
  }

  if (
    (state.projectTypeId === 'bathroom' || state.projectTypeId === 'kitchen') &&
    !/keep|replace|залишити|замінити|fixture|vanity|shower/i.test(d) &&
    !priorAnswers.fixtures
  ) {
    missing.push({
      id: 'q-fixtures',
      field: 'fixtures',
      question: 'Keep existing fixtures or full replacement?',
      required: false,
    })
  }

  if (
    /renovation|ремонт|house_renovation/i.test(state.projectTypeId || '') &&
    !priorAnswers.occupied
  ) {
    missing.push({
      id: 'q-occupied',
      field: 'occupied',
      question: 'Will the space be occupied during works?',
      required: false,
    })
  }

  const unanswered = missing.filter((q) => !priorAnswers[q.field]?.trim())
  const requiredOpen = unanswered.some((q) => q.required)

  return {
    workHints: workHints.slice(0, 8),
    missing: unanswered,
    answered: priorAnswers,
    readyForEstimate: !requiredOpen,
  }
}

/** Merge analyst answers into description for the estimator engine. */
export function appendClarificationsToDescription(
  description: string,
  answers: Record<string, string>,
): string {
  const lines = Object.entries(answers)
    .filter(([, v]) => v.trim())
    .map(([k, v]) => `• ${k.replace(/_/g, ' ')}: ${v.trim()}`)
  if (!lines.length) return description
  return `${description.trim()}\n\n--- Clarifications ---\n${lines.join('\n')}`
}
