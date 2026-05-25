import { supabase } from '../supabase'
import type { AiRouterRequest, AiRouterResponse } from './types'

const AI_ROUTER_FN = 'ai-router'

/**
 * Виклик AI-бота через Supabase Edge Function (ключі API не потрапляють у фронтенд).
 */
export async function invokeAiBot<T = unknown>(
  request: AiRouterRequest,
): Promise<AiRouterResponse<T>> {
  try {
    const { data, error } = await supabase.functions.invoke<AiRouterResponse<T>>(AI_ROUTER_FN, {
      body: request,
    })

    if (error) {
      return { ok: false, error: error.message, fallback: true }
    }

    if (data && typeof data === 'object' && 'ok' in data) {
      return data as AiRouterResponse<T>
    }

    return { ok: true, data: data as T }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'invoke_failed',
      fallback: true,
    }
  }
}

export async function fetchAiProviderStatus(): Promise<{
  openai: boolean
  googleVision: boolean
}> {
  const res = await invokeAiBot<{ openai: boolean; googleVision: boolean }>({
    bot: 'messaging',
    action: 'status',
  })
  if (res.ok && res.data) return res.data
  return { openai: false, googleVision: false }
}
