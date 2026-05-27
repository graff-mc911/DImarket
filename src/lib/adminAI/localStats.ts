import { supabase } from '../supabase'
import type { AdminAiChatResponse } from './adminAiApi'

/** Статистика напряму з Supabase — працює без Edge Function admin-ai-assistant */
export async function fetchLocalPlatformStats(): Promise<AdminAiChatResponse> {
  const [profiles, listings, ads, pendingAds] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('listings').select('id', { count: 'exact', head: true }),
    supabase.from('ad_campaigns').select('id', { count: 'exact', head: true }),
    supabase
      .from('ad_campaigns')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending_review'),
  ])

  const rows = [
    { metric: 'profiles', value: profiles.count ?? 0 },
    { metric: 'listings', value: listings.count ?? 0 },
    { metric: 'ad_campaigns', value: ads.count ?? 0 },
    { metric: 'pending_ads', value: pendingAds.count ?? 0 },
  ]

  const err = profiles.error ?? listings.error ?? ads.error ?? pendingAds.error
  if (err) {
    return {
      reply: `❌ Не вдалося прочитати статистику: ${err.message}`,
    }
  }

  return {
    reply: `📊 Статистика платформи:\n• Користувачів: ${rows[0].value}\n• Оголошень: ${rows[1].value}\n• Рекламних кампаній: ${rows[2].value}\n• На модерації: ${rows[3].value}`,
    table: rows,
  }
}

export function formatAdminAiInvokeError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error)
  if (/failed to send|fetch|network|404|not found/i.test(msg)) {
    return (
      '❌ Сервер Admin AI ще не підключений.\n\n' +
      'На Supabase потрібно задеплоїти функцію `admin-ai-assistant` (npm run deploy:admin-ai).\n\n' +
      'Поки що працюють локальні команди: /stats, /help'
    )
  }
  return `❌ ${msg}`
}
