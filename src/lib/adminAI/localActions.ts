import { supabase } from '../supabase'
import type { AdminAiChatResponse } from './adminAiApi'

type RpcResult = {
  ok?: boolean
  message?: string
  rows?: Record<string, unknown>[]
  full_name?: string
  rating?: number
}

function rpcMessage(data: RpcResult | null, err: { message: string } | null): AdminAiChatResponse {
  if (err) {
    if (/function.*does not exist|42883/i.test(err.message)) {
      return {
        reply:
          '❌ Потрібно один раз виконати SQL у Supabase.\n\n' +
          'SQL Editor → вставте файл:\n' +
          'supabase/migrations/20260702120000_admin_local_rating_rpc.sql\n' +
          'потім:\n' +
          'supabase/migrations/20260702130000_fix_rating_stars_scale.sql\n\n' +
          '→ Run. Після цього: /boost Test 5',
      }
    }
    if (/forbidden|unauthorized/i.test(err.message)) {
      return { reply: '❌ Доступ заборонено. Увійдіть як ivan.sovban@gmail.com' }
    }
    return { reply: `❌ ${err.message}` }
  }
  if (data?.ok === false) {
    return { reply: data.message ?? '❌ Помилка' }
  }
  const rows = Array.isArray(data?.rows) ? (data.rows as Record<string, unknown>[]) : undefined
  return {
    reply: data?.message ?? '✅ Готово.',
    table: rows,
  }
}

export function parseLocalAdminCommand(text: string): {
  type: 'boost' | 'verify' | 'top'
  search?: string
  stars?: number
  limit?: number
} | null {
  const t = text.trim()
  const lower = t.toLowerCase()

  const boostSlash = t.match(/^\/boost\s+(\S+)\s+(\d+(?:[.,]\d+)?)$/i)
  if (boostSlash) {
    return { type: 'boost', search: boostSlash[1], stars: Number(boostSlash[2]) }
  }

  const verifySlash = t.match(/^\/verify\s+(.+)$/i)
  if (verifySlash) {
    return { type: 'verify', search: verifySlash[1].trim() }
  }

  const boostPhrase = lower.match(
    /(?:додай|додати|підніми|підвищ|надай|встанови)\s+(\d+(?:[.,]\d+)?)\s*(?:зірок|зірки|зірку|зір|stars?)(?:\s+(?:майстр[ауі]?|користувач[ауі]?))?\s+(.+)/i,
  )
  if (boostPhrase) {
    return {
      type: 'boost',
      search: boostPhrase[2].replace(/[.!?]+$/, '').trim(),
      stars: Number(boostPhrase[1].replace(',', '.')),
    }
  }

  const starsFirst = lower.match(
    /(\d+(?:[.,]\d+)?)\s*(?:зірок|зірки|зірку|зір|stars?).{0,40}?(?:майстр[ауі]?|користувач[ауі]?)\s+([a-zа-яіїєґ0-9_-]+)/i,
  )
  if (starsFirst) {
    return {
      type: 'boost',
      search: starsFirst[2],
      stars: Number(starsFirst[1].replace(',', '.')),
    }
  }

  const nameFirst = lower.match(
    /(?:майстр[ауі]?|користувач[ауі]?)\s+([a-zа-яіїєґ0-9_-]+).{0,40}?(\d+(?:[.,]\d+)?)\s*(?:зірок|зірки|зірку|зір|stars?)/i,
  )
  if (nameFirst) {
    return {
      type: 'boost',
      search: nameFirst[1],
      stars: Number(nameFirst[2].replace(',', '.')),
    }
  }

  const onlyStars = lower.match(/^(\d+(?:[.,]\d+)?)\s*(?:зірок|зірки|зірку|зір|stars?)\s*(?:майстр[ауі]?\s+)?(.+)?$/i)
  if (onlyStars && onlyStars[2]) {
    return {
      type: 'boost',
      search: onlyStars[2].trim(),
      stars: Number(onlyStars[1].replace(',', '.')),
    }
  }

  const top = lower.match(/(?:топ|top)\s*(\d+)?\s*(?:майстр|професіонал)/)
  if (top) {
    return { type: 'top', limit: Number(top[1] || 5) }
  }

  const verify = lower.match(/(?:верифікуй|verify)\s+(.+)/)
  if (verify) {
    return { type: 'verify', search: verify[1].trim() }
  }

  if (/\btest\b/i.test(lower) && /\d/.test(lower) && /зір|star/i.test(lower)) {
    const n = lower.match(/(\d+(?:[.,]\d+)?)/)?.[1]
    if (n) return { type: 'boost', search: 'Test', stars: Number(n.replace(',', '.')) }
  }

  return null
}

export async function runLocalAdminCommand(text: string): Promise<AdminAiChatResponse | null> {
  const cmd = parseLocalAdminCommand(text)
  if (!cmd) return null

  if (cmd.type === 'boost' && cmd.search) {
    const { data, error } = await supabase.rpc('admin_boost_master_rating', {
      search_name: cmd.search,
      stars: cmd.stars ?? 5,
    })
    const row =
      data && typeof data === 'object' && (data as RpcResult).ok
        ? [
            {
              name: (data as RpcResult).full_name,
              rating: (data as RpcResult).rating,
            },
          ]
        : undefined
    const res = rpcMessage(data as RpcResult | null, error)
    if (row) res.table = row
    return res
  }

  if (cmd.type === 'verify' && cmd.search) {
    const { data, error } = await supabase.rpc('admin_verify_master', {
      search_name: cmd.search,
      verified: true,
    })
    return rpcMessage(data as RpcResult | null, error)
  }

  if (cmd.type === 'top') {
    const { data, error } = await supabase.rpc('admin_top_masters', {
      p_limit: cmd.limit ?? 5,
    })
    return rpcMessage(data as RpcResult | null, error)
  }

  return null
}
