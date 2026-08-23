import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { chatCompletion, normalizeConfidence } from '../_shared/openai.ts'
import { rateLimit } from '../_shared/rateLimit.ts'

type Body = {
  tool: string
  payload?: Record<string, unknown>
  locale?: string
}

const TRADE_HINTS = [
  'painter',
  'drywall',
  'electrician',
  'plumber',
  'roofing',
  'flooring',
  'windows',
  'doors',
  'facade',
  'kitchen',
  'bathroom',
  'general',
]

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405)
  }

  // Rate-limit anonymous/authenticated LLM calls per IP to prevent OpenAI
  // billing abuse. Anonymous access is kept for onboarding flows.
  const rl = rateLimit(req, { windowMs: 60_000, max: 20, keyPrefix: 'ai-assistant' })
  if (!rl.ok) {
    return jsonResponse({ ok: false, error: 'rate_limited', retry_after: rl.retryAfter }, 429)
  }

  try {
    const authHeader = req.headers.get('Authorization')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      authHeader ? { global: { headers: { Authorization: authHeader } } } : {},
    )

    let userId: string | null = null
    if (authHeader) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      userId = user?.id ?? null
    }

    const body = (await req.json()) as Body
    const tool = String(body.tool || '')
    const payload = body.payload ?? {}
    const locale = String(body.locale || 'en')
    const openaiKey = Deno.env.get('OPENAI_API_KEY')

    const result = await runTool(tool, payload, locale, openaiKey, userId)

    // Best-effort log
    if (userId && result.ok) {
      try {
        const admin = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        )
        await admin.from('ai_bot_tasks').insert({
          user_id: userId,
          bot_id: 'assistant',
          action: tool,
          status: 'completed',
          input: payload,
          output: { preview: String(result.data?.text || result.data?.category || '').slice(0, 500) },
        })
      } catch {
        /* optional table */
      }
    }

    return jsonResponse(result, result.ok ? 200 : 400)
  } catch (e) {
    console.error('ai-assistant:', e)
    return jsonResponse({ ok: false, error: String(e) }, 500)
  }
})

async function runTool(
  tool: string,
  payload: Record<string, unknown>,
  locale: string,
  openaiKey: string | undefined,
  _userId: string | null,
): Promise<{ ok: boolean; data?: Record<string, unknown>; error?: string; fallback?: boolean }> {
  switch (tool) {
    case 'estimate_budget':
      return estimateBudget(payload, locale, openaiKey)
    case 'choose_category':
      return chooseCategory(payload, locale, openaiKey)
    case 'generate_quote':
      return generateDoc(
        'quote',
        payload,
        locale,
        openaiKey,
        `You are a construction estimating assistant for DImarket. Write a clear professional quote in ${locale}. Include: title, scope, materials, labor, optional equipment, VAT note, total range, validity (14 days). Use EUR. Plain text, no markdown fences.`,
        1200,
      )
    case 'generate_invoice':
      return generateDoc(
        'invoice',
        payload,
        locale,
        openaiKey,
        `You are an invoicing assistant for DImarket tradespeople. Draft a simple invoice in ${locale}. Include: invoice number placeholder, date, seller/buyer placeholders, line items, subtotal, VAT %, total EUR, payment terms. Plain text.`,
        1000,
      )
    case 'write_proposal':
      return generateDoc(
        'proposal',
        payload,
        locale,
        openaiKey,
        `You write winning service proposals for home-service professionals on DImarket. Language: ${locale}. Structure: intro, understanding of need, proposed approach, timeline, why choose us, next steps. Professional, concise, no legal claims. Plain text.`,
        1400,
      )
    case 'write_contract':
      return generateDoc(
        'contract',
        payload,
        locale,
        openaiKey,
        `You draft a simple service agreement template for trades on DImarket. Language: ${locale}. Include parties placeholders, scope, price, timeline, changes, payment schedule, warranty, liability limits, cancellation, signatures. Add a clear disclaimer that this is a template and not legal advice. Plain text.`,
        1800,
      )
    case 'summarize_chat':
      return summarizeChat(payload, locale, openaiKey)
    case 'improve_profile':
      return improveProfile(payload, locale, openaiKey)
    default:
      return { ok: false, error: 'unknown_tool' }
  }
}

async function estimateBudget(
  payload: Record<string, unknown>,
  locale: string,
  openaiKey: string | undefined,
) {
  const description = String(payload.description || '')
  const trade = String(payload.trade || payload.category || 'general')
  const city = String(payload.city || '')
  const area = Number(payload.areaSqm || 0) || 0

  const base: Record<string, [number, number]> = {
    painter: [18, 45],
    drywall: [25, 70],
    electrician: [40, 120],
    plumber: [45, 130],
    roofing: [60, 180],
    flooring: [20, 80],
    windows: [150, 600],
    doors: [120, 450],
    facade: [50, 160],
    kitchen: [800, 5000],
    bathroom: [1500, 8000],
    general: [100, 2000],
  }
  const [loUnit, hiUnit] = base[trade] ?? base.general
  const qty = area > 0 ? area : 1
  let minPrice = Math.round(loUnit * qty)
  let maxPrice = Math.round(hiUnit * qty)
  let explanation = `Estimated range for ${trade}${city ? ` in ${city}` : ''}.`
  let confidence = 55
  let fallback = true

  if (openaiKey && description) {
    const ai = await chatCompletion(
      openaiKey,
      `Return ONLY JSON: {"min":number,"max":number,"explanation":string,"confidence":number,"labor":number,"materials":number}. Currency EUR. Language for explanation: ${locale}. confidence must be integer 0-100.`,
      `Trade: ${trade}. City: ${city}. Area m2: ${area || 'n/a'}. Job: ${description}`,
      undefined,
      400,
    )
    if (ai) {
      try {
        const parsed = JSON.parse(ai.replace(/```json|```/g, '').trim())
        if (parsed.min != null && parsed.max != null) {
          minPrice = Number(parsed.min)
          maxPrice = Number(parsed.max)
          explanation = String(parsed.explanation || explanation)
          confidence = normalizeConfidence(parsed.confidence, 70)
          fallback = false
          return {
            ok: true,
            data: {
              minPrice,
              maxPrice,
              currency: 'EUR',
              explanation,
              confidence,
              labor: parsed.labor,
              materials: parsed.materials,
              text: `${explanation}\n\nLow: €${minPrice}\nHigh: €${maxPrice}\nConfidence: ${confidence}%`,
            },
            fallback,
          }
        }
      } catch {
        /* use heuristic */
      }
    }
  }

  return {
    ok: true,
    data: {
      minPrice,
      maxPrice,
      currency: 'EUR',
      explanation,
      confidence,
      text: `${explanation}\n\nLow: €${minPrice}\nHigh: €${maxPrice}\nConfidence: ${confidence}%`,
    },
    fallback,
  }
}

async function chooseCategory(
  payload: Record<string, unknown>,
  locale: string,
  openaiKey: string | undefined,
) {
  const description = String(payload.description || '')
  if (!description.trim()) return { ok: false, error: 'description_required' }

  let category = 'general'
  let label = 'General Contractor'
  let reason = 'Default general category'
  let alternatives: string[] = []
  let fallback = true

  if (openaiKey) {
    const ai = await chatCompletion(
      openaiKey,
      `Pick the best trade category for a home service job. Allowed ids: ${TRADE_HINTS.join(', ')}. Return ONLY JSON: {"category":string,"label":string,"reason":string,"alternatives":string[]}. Language for reason/label: ${locale}.`,
      description,
      undefined,
      300,
    )
    if (ai) {
      try {
        const parsed = JSON.parse(ai.replace(/```json|```/g, '').trim())
        if (parsed.category && TRADE_HINTS.includes(String(parsed.category))) {
          category = String(parsed.category)
          label = String(parsed.label || category)
          reason = String(parsed.reason || '')
          alternatives = Array.isArray(parsed.alternatives)
            ? parsed.alternatives.map(String).filter((x) => TRADE_HINTS.includes(x))
            : []
          fallback = false
        }
      } catch {
        /* heuristic below */
      }
    }
  }

  if (fallback) {
    const lower = description.toLowerCase()
    const rules: Array<[string, string, string]> = [
      ['paint|фарб|маляр', 'painter', 'Painting'],
      ['electr|електр|wiring|socket', 'electrician', 'Electrical'],
      ['plumb|сантех|pipe|leak|toilet', 'plumber', 'Plumbing'],
      ['roof|дах|dach', 'roofing', 'Roofing'],
      ['floor|підлог|laminat', 'flooring', 'Flooring'],
      ['kitchen|кухн', 'kitchen', 'Kitchen'],
      ['bath|ванн', 'bathroom', 'Bathroom'],
      ['drywall|гіпсокартон|gips', 'drywall', 'Drywall'],
      ['window|вікн', 'windows', 'Windows'],
      ['door|двер', 'doors', 'Doors'],
      ['facade|фасад', 'facade', 'Facade'],
    ]
    for (const [re, id, lab] of rules) {
      if (new RegExp(re, 'i').test(lower)) {
        category = id
        label = lab
        reason = `Matched keywords for ${lab}`
        break
      }
    }
  }

  return {
    ok: true,
    data: {
      category,
      label,
      reason,
      alternatives,
      text: `Suggested category: ${label} (${category})\n${reason}${
        alternatives.length ? `\nAlso consider: ${alternatives.join(', ')}` : ''
      }`,
    },
    fallback,
  }
}

async function generateDoc(
  kind: string,
  payload: Record<string, unknown>,
  locale: string,
  openaiKey: string | undefined,
  system: string,
  maxTokens: number,
) {
  const context = [
    payload.jobTitle ? `Job title: ${payload.jobTitle}` : '',
    payload.clientName ? `Client: ${payload.clientName}` : '',
    payload.proName ? `Professional: ${payload.proName}` : '',
    payload.city ? `City: ${payload.city}` : '',
    payload.trade ? `Trade: ${payload.trade}` : '',
    payload.budget ? `Budget hint: ${payload.budget}` : '',
    payload.description ? `Description:\n${payload.description}` : '',
    payload.extra ? `Notes:\n${payload.extra}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  if (!context.trim()) {
    return { ok: false, error: 'context_required' }
  }

  if (openaiKey) {
    const ai = await chatCompletion(openaiKey, system, context, undefined, maxTokens)
    if (ai) {
      return { ok: true, data: { text: ai, kind }, fallback: false }
    }
  }

  return {
    ok: true,
    data: { text: localTemplate(kind, payload, locale), kind },
    fallback: true,
  }
}

async function summarizeChat(
  payload: Record<string, unknown>,
  locale: string,
  openaiKey: string | undefined,
) {
  const transcript = String(payload.transcript || '')
  if (!transcript.trim()) return { ok: false, error: 'transcript_required' }

  if (openaiKey) {
    const ai = await chatCompletion(
      openaiKey,
      `Summarize this marketplace chat in ${locale}. Include: goal, decisions, open questions, next actions, quoted prices if any. Bullet points. Plain text.`,
      transcript.slice(0, 12000),
      undefined,
      900,
    )
    if (ai) return { ok: true, data: { text: ai }, fallback: false }
  }

  const lines = transcript.split('\n').filter((l) => l.trim())
  const preview = lines.slice(0, 8).join('\n')
  return {
    ok: true,
    data: {
      text: `Chat summary (offline)\n• Messages: ${lines.length}\n• Opening:\n${preview}\n• Next: confirm scope, price, and start date.`,
    },
    fallback: true,
  }
}

async function improveProfile(
  payload: Record<string, unknown>,
  locale: string,
  openaiKey: string | undefined,
) {
  const name = String(payload.fullName || 'Professional')
  const bio = String(payload.bio || '')
  const trade = String(payload.trade || 'home services')
  const location = String(payload.location || '')
  const score = Number(payload.qualityScore || 0)

  if (openaiKey) {
    const ai = await chatCompletion(
      openaiKey,
      `Improve a DImarket professional profile in ${locale}. Return plain text with sections: Score notes, Improved bio (120-180 words), Headline, Services list (5 bullets), Call to action. Do not invent fake certifications.`,
      `Name: ${name}\nTrade: ${trade}\nLocation: ${location}\nCurrent bio: ${bio || '(empty)'}\nHeuristic score: ${score}`,
      undefined,
      1100,
    )
    if (ai) return { ok: true, data: { text: ai }, fallback: false }
  }

  const improved = `${name} — ${trade} specialist${location ? ` in ${location}` : ''}.\n\nI help customers get reliable results with clear pricing, on-time delivery, and careful workmanship. ${
    bio.trim() || 'Tell clients about your experience, materials you use, and typical project sizes.'
  }\n\nServices:\n• Consultation and site visit\n• Transparent quote\n• Quality installation\n• Cleanup\n• Aftercare tips\n\nCTA: Message me on DImarket to book a free estimate.`

  return { ok: true, data: { text: improved }, fallback: true }
}

function localTemplate(kind: string, payload: Record<string, unknown>, locale: string): string {
  const title = String(payload.jobTitle || 'Service request')
  const desc = String(payload.description || 'Scope to be confirmed on site.')
  const client = String(payload.clientName || '[Client name]')
  const pro = String(payload.proName || '[Your business name]')
  const city = String(payload.city || '[City]')

  if (kind === 'quote') {
    return `QUOTE — ${title}\nPrepared for: ${client}\nFrom: ${pro}\nLocation: ${city}\n\nScope:\n${desc}\n\nMaterials: TBD\nLabor: TBD\nEquipment: TBD\n\nEstimated total: €[amount] (excl. VAT)\nValid for 14 days.\n\n(${locale} draft — offline template)`
  }
  if (kind === 'invoice') {
    return `INVOICE\nNo: INV-XXXX\nDate: [today]\nSeller: ${pro}\nBuyer: ${client}\n\n1. ${title} — €[amount]\n\nSubtotal: €[amount]\nVAT: [%\nTotal: €[amount]\nPayment due: 7 days\n\n(${locale} draft — offline template)`
  }
  if (kind === 'proposal') {
    return `PROPOSAL\nDear ${client},\n\nThank you for your enquiry about “${title}” in ${city}.\n\nUnderstanding:\n${desc}\n\nApproach:\n1. Site assessment\n2. Detailed quote\n3. Scheduled works\n4. Handover\n\nWhy us: clear communication, quality materials, clean finish.\n\nNext step: reply on DImarket to confirm a visit.\n\n${pro}`
  }
  return `SERVICE AGREEMENT (TEMPLATE — NOT LEGAL ADVICE)\n\nParties: ${pro} (“Provider”) and ${client} (“Client”)\nProject: ${title} in ${city}\n\n1. Scope\n${desc}\n\n2. Price & payment\nPrice to be agreed in writing. Deposit may apply.\n\n3. Timeline\nStart/end dates to be agreed.\n\n4. Changes\nExtra work requires written approval.\n\n5. Warranty\nWorkmanship warranty as agreed in writing.\n\n6. Liability\nProvider liability limited to the contract price except where prohibited by law.\n\n7. Cancellation\nEither party may cancel with written notice under agreed terms.\n\nSignatures:\nProvider: __________  Client: __________\n\nDisclaimer: This is a template for ${locale} users and is not legal advice.`
}
