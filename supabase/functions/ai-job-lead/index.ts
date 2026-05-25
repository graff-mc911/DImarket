import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { chatCompletion } from '../_shared/openai.ts'

type Body = {
  message?: string
  locale?: string
  draft?: Record<string, unknown>
  sessionId?: string
}

const LOCALE_NAMES: Record<string, string> = {
  en: 'English',
  uk: 'Ukrainian',
  ru: 'Russian',
  de: 'German',
  pl: 'Polish',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  try {
    const body = (await req.json()) as Body
    const message = body.message?.trim()
    if (!message) return jsonResponse({ error: 'message_required' }, 400)

    const lang = LOCALE_NAMES[body.locale ?? 'en'] ?? 'English'
    const draftJson = JSON.stringify(body.draft ?? {})

    const system = `You are Dimarket AI job intake assistant for construction and home services.
Respond in ${lang}. Be concise and friendly.
From the user message, extract structured fields when possible:
category, subcategory, city, region, country, budget_min, budget_max, start_date, urgency, project_size, materials_included, description.
Also list missing_fields (array of short keys) still needed before publishing.
Return ONLY valid JSON:
{"reply":"...","extracted":{...},"missing":["city","budget"]}`

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    let parsed: { reply?: string; extracted?: Record<string, unknown>; missing?: string[] } | null = null

    if (openaiKey) {
      const raw = await chatCompletion(openaiKey, system, `Current draft: ${draftJson}\nUser: ${message}`)
      if (raw) {
        try {
          const jsonStart = raw.indexOf('{')
          const jsonEnd = raw.lastIndexOf('}')
          if (jsonStart >= 0 && jsonEnd > jsonStart) {
            parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1))
          }
        } catch {
          parsed = { reply: raw, extracted: {}, missing: [] }
        }
      }
    }

    if (!parsed?.reply) {
      parsed = {
        reply: `Thanks! Tell me more about location, budget, and timeline for your project.`,
        extracted: {},
        missing: ['location', 'budget', 'timeline'],
      }
    }

    return jsonResponse({
      reply: parsed.reply,
      extracted: parsed.extracted ?? {},
      missing: parsed.missing ?? [],
      sessionId: body.sessionId,
    })
  } catch (e) {
    console.error(e)
    return jsonResponse({ error: 'internal_error' }, 500)
  }
})
