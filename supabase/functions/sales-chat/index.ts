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
/** Client owns the step machine (problem-first guide); edge only polishes text. */
type Step = string

type Body = {
  message?: string
  step?: Step
  /** Step after local engine advanced (client-owned state machine). */
  nextStep?: Step
  draft?: Draft
  locale?: string
  suggestedReplyKey?: string
  suggestedParams?: Record<string, string>
}

/**
 * Optional LLM polish for Dimarket job-request chat.
 * Client always runs salesBotEngine for draft/step; this only returns replyText.
 * Without OPENAI_API_KEY → 501 so client keeps local i18n reply.
 */
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

    if (!openaiKey || !body.message?.trim()) {
      return jsonResponse(
        {
          error: 'use_client_engine',
          step: body.nextStep ?? body.step,
          draft: body.draft,
        },
        501,
      )
    }

    const draftJson = JSON.stringify(body.draft ?? {})
    const paramsJson = JSON.stringify(body.suggestedParams ?? {})
    const system = `You are Dimarket's problem-first assistant for a European construction marketplace.
Respond in ${localeLanguage(body.locale)} only.
The client already advanced the form: previous step=${body.step ?? 'welcome'}, next step=${body.nextStep ?? body.step ?? 'welcome'}.
Your job: write ONE short friendly assistant message (1–3 sentences) that matches the next step and suggested template.
Rules:
- NEVER ask the user to pick a service category from a list if the draft already has problemText, tradeRole, or categorySlug.
- If the user described a problem (e.g. no lights / power outage), acknowledge it and ask the diagnostic question for the next step only.
- Do not invent categories or cities that contradict the draft JSON.
- Do not ask for multiple fields at once.
- Do not wrap the answer in quotes or markdown.
Draft JSON: ${draftJson}
Suggested template key: ${body.suggestedReplyKey ?? 'none'}
Suggested template params: ${paramsJson}`

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
          {
            role: 'user',
            content: `User just said: ${body.message}\nWrite the next assistant prompt.`,
          },
        ],
        max_tokens: 220,
        temperature: 0.35,
      }),
    })

    if (!res.ok) {
      return jsonResponse(
        {
          error: 'openai_failed',
          status: res.status,
          step: body.nextStep ?? body.step,
          draft: body.draft,
        },
        502,
      )
    }

    const data = await res.json()
    const replyText = String(data?.choices?.[0]?.message?.content ?? '').trim()
    if (!replyText) {
      return jsonResponse({ error: 'empty_reply' }, 502)
    }

    return jsonResponse({
      replyText,
      step: body.nextStep ?? body.step ?? 'category',
      draft: body.draft ?? {},
      canPublish: false,
    })
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500)
  }
})
