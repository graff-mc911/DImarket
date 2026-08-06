import { supabase } from '../supabase'
import type { JobRequestDraft } from './jobRequestDraft'

export type JobLeadSession = {
  id: string
  user_id: string | null
  locale: string
  status: string
  draft: JobRequestDraft
  extracted: Record<string, unknown>
  listing_id: string | null
}

export async function createJobLeadSession(
  userId: string | null,
  locale: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('ai_job_sessions')
    .insert({ user_id: userId, locale, draft: {}, extracted: {} })
    .select('id')
    .single()
  if (error) {
    console.error('createJobLeadSession:', error)
    return null
  }
  return data.id
}

export async function appendJobLeadMessage(
  sessionId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  meta?: Record<string, unknown>,
): Promise<void> {
  await supabase.from('ai_job_messages').insert({
    session_id: sessionId,
    role,
    content,
    meta: meta ?? {},
  })
}

export async function updateJobLeadDraft(
  sessionId: string,
  draft: JobRequestDraft,
  extracted?: Record<string, unknown>,
): Promise<void> {
  await supabase
    .from('ai_job_sessions')
    .update({
      draft,
      extracted: extracted ?? {},
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
}

export async function recordPublishedJob(
  sessionId: string,
  userId: string | null,
  listingId: string,
  draft: JobRequestDraft,
  title: string,
  description: string,
): Promise<void> {
  await Promise.all([
    supabase.from('ai_generated_jobs').insert({
      session_id: sessionId,
      user_id: userId,
      listing_id: listingId,
      draft,
      title,
      description,
      published_at: new Date().toISOString(),
    }),
    supabase
      .from('ai_job_sessions')
      .update({ status: 'published', listing_id: listingId, updated_at: new Date().toISOString() })
      .eq('id', sessionId),
  ])
}
