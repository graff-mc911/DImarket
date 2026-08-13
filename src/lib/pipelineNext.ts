/**
 * Shared “what’s next?” for the AI project pipeline.
 * One source of truth for stage → path / label across chat, dashboards, listing.
 */

import type { TranslationKey } from './i18n'

export type PipelineStage =
  | 'intake'
  | 'matched'
  | 'awaiting_responses'
  | 'offers'
  | 'in_progress'
  | 'completed'
  | string

export type PipelineNextAction = {
  stage: PipelineStage
  /** i18n key under pipeline.* */
  labelKey: TranslationKey
  /** English fallback */
  labelEn: string
  path: string
  /** Short chip label for stage */
  stageLabelKey: TranslationKey
  stageLabelEn: string
}

export type PipelineListingLike = {
  id: string
  pipeline_stage?: string | null
  hired_professional_id?: string | null
  pipeline_completed_at?: string | null
  review_prompted_at?: string | null
}

export function normalizePipelineStage(
  listing: PipelineListingLike,
  opts?: { hasQuotes?: boolean; needsReview?: boolean },
): PipelineStage {
  const raw = (listing.pipeline_stage || '').trim()
  if (listing.hired_professional_id && (raw === 'completed' || listing.pipeline_completed_at)) {
    return 'completed'
  }
  if (listing.hired_professional_id || raw === 'in_progress') return 'in_progress'
  if (raw === 'offers' || opts?.hasQuotes) return 'offers'
  if (raw === 'awaiting_responses') return 'awaiting_responses'
  if (raw === 'matched') return 'matched'
  return raw || 'intake'
}

/** Primary next action for the project owner (customer). */
export function pipelineNextAction(
  listing: PipelineListingLike,
  opts?: { hasQuotes?: boolean; needsReview?: boolean },
): PipelineNextAction {
  const stage = normalizePipelineStage(listing, opts)
  const id = listing.id

  if (stage === 'completed') {
    if (opts?.needsReview && listing.hired_professional_id) {
      return {
        stage,
        labelKey: 'pipeline.leaveReview',
        labelEn: 'Leave a review',
        path: `/project/${id}/manage`,
        stageLabelKey: 'pipeline.stageCompleted',
        stageLabelEn: 'Completed',
      }
    }
    return {
      stage,
      labelKey: 'pipeline.openManage',
      labelEn: 'Open project manager',
      path: `/project/${id}/manage`,
      stageLabelKey: 'pipeline.stageCompleted',
      stageLabelEn: 'Completed',
    }
  }

  if (stage === 'in_progress') {
    return {
      stage,
      labelKey: 'pipeline.openManage',
      labelEn: 'Open project manager',
      path: `/project/${id}/manage`,
      stageLabelKey: 'pipeline.stageInProgress',
      stageLabelEn: 'In progress',
    }
  }

  if (stage === 'offers') {
    return {
      stage,
      labelKey: 'pipeline.compareOffers',
      labelEn: 'Compare offers',
      path: `/project/${id}/offers`,
      stageLabelKey: 'pipeline.stageOffers',
      stageLabelEn: 'Offers',
    }
  }

  if (stage === 'awaiting_responses') {
    return {
      stage,
      labelKey: 'pipeline.viewMatches',
      labelEn: 'View matches & responses',
      path: `/project/${id}/matches`,
      stageLabelKey: 'pipeline.stageAwaiting',
      stageLabelEn: 'Awaiting responses',
    }
  }

  // intake / matched / default → matches (AI Match board)
  return {
    stage,
    labelKey: 'pipeline.viewMatches',
    labelEn: 'View matches',
    path: `/project/${id}/matches`,
    stageLabelKey: stage === 'matched' ? 'pipeline.stageMatched' : 'pipeline.stageIntake',
    stageLabelEn: stage === 'matched' ? 'Matched' : 'Published',
  }
}

/** Hired professional next step. */
export function pipelineNextForPro(listing: PipelineListingLike): PipelineNextAction {
  const stage = normalizePipelineStage(listing)
  const id = listing.id
  if (stage === 'completed') {
    return {
      stage,
      labelKey: 'pipeline.openManage',
      labelEn: 'View completed project',
      path: `/project/${id}/manage`,
      stageLabelKey: 'pipeline.stageCompleted',
      stageLabelEn: 'Completed',
    }
  }
  return {
    stage: stage === 'in_progress' ? stage : 'in_progress',
    labelKey: 'pipeline.openManage',
    labelEn: 'Open project manager',
    path: `/project/${id}/manage`,
    stageLabelKey: 'pipeline.stageInProgress',
    stageLabelEn: 'In progress',
  }
}
