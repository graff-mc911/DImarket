import { aiDb } from './db'
import type { BotId } from '../bots/types'

export async function createConversation(
  botId: BotId,
  userId: string | null,
  locale: string,
  context: Record<string, unknown> = {},
) {
  const { data, error } = await aiDb
    .from('ai_conversations')
    .insert({
      user_id: userId,
      bot_id: botId,
      locale,
      context,
      status: 'active',
    })
    .select('id')
    .maybeSingle()

  if (error) return { id: null as string | null, error: error.message }
  return { id: data?.id ?? null, error: null }
}

export async function appendConversationMessage(
  conversationId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  meta: Record<string, unknown> = {},
) {
  return aiDb.from('ai_messages').insert({
    conversation_id: conversationId,
    role,
    content,
    meta,
  })
}

export async function saveBotTask(
  userId: string | null,
  botId: BotId,
  action: string,
  input: Record<string, unknown>,
  output: Record<string, unknown> | null,
  status: 'completed' | 'failed',
  errorMessage?: string,
) {
  return aiDb.from('ai_bot_tasks').insert({
    user_id: userId,
    bot_id: botId,
    action,
    status,
    input,
    output,
    error_message: errorMessage ?? null,
    completed_at: new Date().toISOString(),
  })
}
