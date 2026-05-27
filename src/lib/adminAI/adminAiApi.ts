import { supabase } from '../supabase'

export type AdminAiMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  table?: Record<string, unknown>[]
  timestamp: number
}

export type AdminAiAlert = {
  id: string
  message: string
  severity: 'info' | 'warning' | 'error'
  timestamp: number
}

export type AdminAiChatResponse = {
  reply: string
  table?: Record<string, unknown>[]
  pendingConfirmation?: boolean
}

export type HealthCheckResult = {
  ok: boolean
  latencyMs: number
  alerts: string[]
  message: string
}

const FN = 'admin-ai-assistant'

async function invoke<T>(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke<{ ok: boolean; data?: T; error?: string; message?: string }>(
    FN,
    { body },
  )
  if (error) throw error
  if (!data?.ok) throw new Error(data?.error ?? data?.message ?? 'admin_ai_error')
  return data.data as T
}

export const adminAiApi = {
  chat: (message: string, history: { role: 'user' | 'assistant'; content: string }[], confirmed?: boolean) =>
    invoke<AdminAiChatResponse>({ action: 'chat', message, history, confirmed }),

  health: () => invoke<HealthCheckResult>({ action: 'health' }),

  webSearch: (query: string) =>
    invoke<{ reply: string }>({ action: 'web_search', payload: { query } }),

  saveCorrection: (question: string, answer: string) =>
    invoke<{ reply: string }>({ action: 'save_correction', payload: { question, answer } }),

  listKnowledge: () =>
    invoke<{ items: { question: string; answer: string; source: string }[] }>({ action: 'list_knowledge' }),
}

export function parseLocalShortcut(input: string): string | null {
  const t = input.trim().toLowerCase()
  if (t === '/help') {
    return `Команди (працюють без хмарного AI):
/stats — статистика
/boost Імʼя N — +N зірок майстру (напр. /boost Test 5)
/verify Імʼя — верифікація
«додай 5 зірок майстру Test» — те саме
«топ 5 майстрів» — рейтинг
/help — цей список`
  }
  return null
}
