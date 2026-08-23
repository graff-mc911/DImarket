import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { rateLimit } from '../_shared/rateLimit.ts'

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
  mode?: 'polish' | 'diagnose'
  message?: string
  step?: Step
  /** Step after local engine advanced (client-owned state machine). */
  nextStep?: Step
  draft?: Draft
  locale?: string
  suggestedReplyKey?: string
  suggestedParams?: Record<string, string>
  suggestedReplyText?: string
  suggestedQuickReplies?: string[]
}

/**
 * Optional LLM polish / problem-specific diagnose for Dimarket job chat.
 * Client always owns draft/step; this only returns replyText (+ optional quickReplies).
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const rl = rateLimit(req, { windowMs: 60_000, max: 30, keyPrefix: 'sales-chat' })
  if (!rl.ok) return jsonResponse({ error: 'rate_limited', retry_after: rl.retryAfter }, 429)

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

    const draft = body.draft ?? {}
    const draftJson = JSON.stringify(draft)
    const paramsJson = JSON.stringify(body.suggestedParams ?? {})
    const mode = body.mode === 'diagnose' ? 'diagnose' : 'polish'
    const problem = String(draft.problemText ?? body.message ?? '')
    const kind = String(draft.problemKind ?? '')

    const system =
      mode === 'diagnose'
        ? `You are a diagnostic assistant for Dimarket (construction / home repair marketplace).
Respond in ${localeLanguage(body.locale)} only.
The client already described a PROBLEM. You must ask ONE short follow-up question that helps diagnose THAT problem and choose the right trade (electrician vs AC tech vs plumber vs handyman…).
Hard rules:
- Analyze the actual problem text — NEVER reuse an unrelated template.
- If the problem is an air conditioner that cools poorly: ask about warm air / weak cooling / water leak / noise / dirty filter — NOT about electrical breakers, sparks, or dark rooms.
- If power outage / no lights: then ask about smell, sparks, breaker, one room vs whole flat.
- If plumbing: ask where it leaks / pressure.
- Do NOT ask the user to pick a service category from a list.
- Do NOT ask for city/location yet (that comes later).
- Return ONLY valid JSON: {"replyText":"string","quickReplies":["...","..."]} with 3-6 short quickReplies in the same language.
Problem kind hint: ${kind || 'unknown'}
Draft JSON: ${draftJson}`
        : `You are Dimarket's problem-first assistant for a European construction marketplace.
Respond in ${localeLanguage(body.locale)} only.
The client already advanced the form: previous step=${body.step ?? 'welcome'}, next step=${body.nextStep ?? body.step ?? 'welcome'}.
Your job: write ONE short friendly assistant message (1–3 sentences) that matches the next step.
Rules:
- NEVER ask the user to pick a service category from a list if the draft already has problemText, tradeRole, or categorySlug.
- Stay on-topic for the problem in the draft (AC ≠ electrical outage).
- Do not invent categories or cities that contradict the draft JSON.
- Do not ask for multiple fields at once.
- Do not wrap the answer in quotes or markdown.
Draft JSON: ${draftJson}
Suggested template key: ${body.suggestedReplyKey ?? 'none'}
Suggested template params: ${paramsJson}
Local fallback text: ${body.suggestedReplyText ?? ''}`

    const userContent =
      mode === 'diagnose'
        ? `Problem: ${problem}\nClient just answered about duration: ${body.message}\nAsk the next diagnostic question as JSON.`
        : `User just said: ${body.message}\nWrite the next assistant prompt.`

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
          { role: 'user', content: userContent },
        ],
        max_tokens: mode === 'diagnose' ? 280 : 220,
        temperature: 0.35,
        ...(mode === 'diagnose' ? { response_format: { type: 'json_object' } } : {}),
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
    const raw = String(data?.choices?.[0]?.message?.content ?? '').trim()
    if (!raw) {
      return jsonResponse({ error: 'empty_reply' }, 502)
    }

    if (mode === 'diagnose') {
      try {
        const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()) as {
          replyText?: string
          quickReplies?: string[]
        }
        const replyText = String(parsed.replyText ?? '').trim()
        if (!replyText) return jsonResponse({ error: 'empty_reply' }, 502)
        return jsonResponse({
          replyText,
          quickReplies: Array.isArray(parsed.quickReplies)
            ? parsed.quickReplies.map(String).slice(0, 6)
            : body.suggestedQuickReplies ?? [],
          step: body.nextStep ?? body.step,
          draft: body.draft ?? {},
          canPublish: false,
        })
      } catch {
        return jsonResponse({
          replyText: raw,
          quickReplies: body.suggestedQuickReplies ?? [],
          step: body.nextStep ?? body.step,
          draft: body.draft ?? {},
          canPublish: false,
        })
      }
    }

    return jsonResponse({
      replyText: raw,
      step: body.nextStep ?? body.step ?? 'welcome',
      draft: body.draft ?? {},
      canPublish: false,
    })
  } catch (e) {
    console.error('sales-chat:', e)
    return jsonResponse({ error: 'internal_error' }, 500)
  }
})
