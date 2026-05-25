import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

const LOCALE_NAMES: Record<string, string> = {
  en: 'English',
  uk: 'Ukrainian',
  ru: 'Russian',
  pl: 'Polish',
  de: 'German',
  fr: 'French',
  es: 'Spanish',
  it: 'Italian',
  pt: 'Portuguese',
  ro: 'Romanian',
  cs: 'Czech',
  sk: 'Slovak',
  hu: 'Hungarian',
  bg: 'Bulgarian',
  sr: 'Serbian',
  hr: 'Croatian',
  sl: 'Slovenian',
  lt: 'Lithuanian',
  lv: 'Latvian',
  et: 'Estonian',
  tr: 'Turkish',
  kk: 'Kazakh',
  ar: 'Arabic',
  zh: 'Chinese',
  ja: 'Japanese',
}

function localeLanguage(code?: string): string {
  if (!code) return 'English'
  return LOCALE_NAMES[code] ?? 'English'
}

type Draft = Record<string, unknown>
type Step =
  | 'welcome'
  | 'category'
  | 'city'
  | 'budget'
  | 'deadline'
  | 'description'
  | 'photos'
  | 'contact'
  | 'confirm'
  | 'done'

type Body = {
  message?: string
  step?: Step
  draft?: Draft
  locale?: string
}

/** Мінімальний серверний fallback (повна логіка — у клієнтському salesBotEngine). */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const body = (await req.json()) as Body
    const openaiKey = Deno.env.get('OPENAI_API_KEY')

    if (openaiKey && body.message?.trim()) {
      const system = `You are Dimarket sales assistant. Help user post a construction job request. 
Respond in ${localeLanguage(body.locale)}. 
Keep answers short. Current step: ${body.step ?? 'welcome'}. 
Extract structured fields into JSON when possible: category, city, budget, deadline_days, description, photo_urls.`

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini',
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: body.message },
          ],
          max_tokens: 400,
          temperature: 0.4,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const replyText = data?.choices?.[0]?.message?.content?.trim()
        if (replyText) {
          return jsonResponse({
            replyText,
            step: body.step ?? 'category',
            draft: body.draft ?? {},
            canPublish: false,
          })
        }
      }
    }

    return jsonResponse({
      error: 'use_client_engine',
      step: body.step,
      draft: body.draft,
    }, 501)
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500)
  }
})
