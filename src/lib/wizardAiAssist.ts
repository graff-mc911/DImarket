import { PROJECT_TRADES, suggestTradesFromText } from './projectWizard'

/** Improve grammar/structure of a project description (local + optional edge). */
export async function improveProjectDescription(input: {
  description: string
  tradeId?: string | null
  city?: string
  language?: string
}): Promise<{ text: string; source: 'local' | 'edge' }> {
  const raw = input.description.trim()
  if (!raw) return { text: '', source: 'local' }

  try {
    const { data, error } = await (await import('./supabase')).supabase.functions.invoke(
      'ai-assistant',
      {
        body: {
          tool: 'improve_project_description',
          description: raw,
          tradeId: input.tradeId,
          city: input.city,
          language: input.language || 'en',
        },
      },
    )
    if (!error && data) {
      const text =
        (data as { text?: string; result?: string; message?: string }).text ||
        (data as { result?: string }).result ||
        (data as { message?: string }).message
      if (text && text.trim().length >= 20) {
        return { text: text.trim(), source: 'edge' }
      }
    }
  } catch {
    /* fall through to local */
  }

  return { text: polishLocally(raw, input.tradeId, input.city), source: 'local' }
}

function polishLocally(text: string, tradeId?: string | null, city?: string): string {
  let body = text.replace(/\s+/g, ' ').trim()
  if (body.length) {
    body = body.charAt(0).toUpperCase() + body.slice(1)
  }
  if (!/[.!?]$/.test(body)) body += '.'

  const trade = PROJECT_TRADES.find((t) => t.id === tradeId)
  const tradeLabel = trade?.labelEn || suggestTradesFromText(body, 1)[0]?.labelEn || 'project'
  const place = city?.trim() ? ` in ${city.trim()}` : ''

  const hasStructure =
    /scope|location|materials|timeline|budget/i.test(body) || body.split('.').length >= 3

  if (hasStructure) return body

  return [
    `Project: ${tradeLabel}${place}.`,
    '',
    'Scope of work:',
    body,
    '',
    'Please share availability, estimated timeline, and a transparent quote.',
  ].join('\n')
}
