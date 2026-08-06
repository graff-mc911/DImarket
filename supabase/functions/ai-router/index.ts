import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { chatCompletion, normalizeConfidence, translateWithOpenai } from '../_shared/openai.ts'

type Body = {
  bot?: string
  action?: string
  payload?: Record<string, unknown>
  locale?: string
}

const DISPOSABLE = ['mailinator.com', 'tempmail.com', 'yopmail.com']
const SCAM = [/wire transfer/i, /western union/i, /шахрай/i, /обман/i]

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405)
  }

  const authHeader = req.headers.get('Authorization')
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    authHeader ? { global: { headers: { Authorization: authHeader } } } : {},
  )

  let userId: string | null = null
  if (authHeader) {
    const { data: { user } } = await supabase.auth.getUser()
    userId = user?.id ?? null
  }

  const body = (await req.json()) as Body
  const bot = body.bot ?? ''
  const action = body.action ?? ''
  const payload = body.payload ?? {}
  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  const visionKey = Deno.env.get('GOOGLE_VISION_API_KEY')

  try {
    switch (bot) {
      case 'messaging':
        if (action === 'status') {
          return jsonResponse({
            ok: true,
            data: {
              openai: Boolean(openaiKey),
              googleVision: Boolean(visionKey),
              telegram: Boolean(Deno.env.get('TELEGRAM_BOT_TOKEN')),
              whatsapp: Boolean(Deno.env.get('WHATSAPP_ACCESS_TOKEN')),
            },
          })
        }
        return jsonResponse({ ok: false, error: 'unknown_action', fallback: true }, 400)

      case 'translation': {
        if (action !== 'translate') break
        const text = String(payload.text ?? '')
        const sourceLang = String(payload.sourceLang ?? 'en')
        const targetLang = String(payload.targetLang ?? 'uk')
        if (!text) return jsonResponse({ ok: false, error: 'empty_text' }, 400)

        let translated = text
        let provider = 'passthrough'
        let fallbackUsed = sourceLang === targetLang

        if (openaiKey && sourceLang !== targetLang) {
          const ai = await translateWithOpenai(openaiKey, text, sourceLang, targetLang)
          if (ai) {
            translated = ai
            provider = 'openai'
            fallbackUsed = false
          } else {
            fallbackUsed = true
          }
        } else if (sourceLang !== targetLang) {
          fallbackUsed = true
        }

        if (userId && payload.sourceType && payload.sourceId) {
          const admin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
          )
          await admin.from('ai_translations').upsert({
            source_type: String(payload.sourceType),
            source_id: String(payload.sourceId),
            field_name: String(payload.fieldName ?? 'body'),
            source_lang: sourceLang,
            target_lang: targetLang,
            original_text: text,
            translated_text: translated,
            fallback_used: fallbackUsed,
            provider,
          })
        }

        const openaiFailed =
          sourceLang !== targetLang && provider !== 'openai' && Boolean(openaiKey)

        return jsonResponse({
          ok: true,
          data: {
            originalText: text,
            translatedText: translated,
            targetLang,
            fallbackUsed,
            provider,
            ...(openaiFailed ? { warning: 'openai_unavailable_check_billing' } : {}),
          },
        })
      }

      case 'fraud': {
        if (action !== 'scan') break
        const text = String(payload.text ?? '')
        const email = String(payload.email ?? '').toLowerCase()
        const flags: string[] = []
        let risk = 0
        for (const p of SCAM) {
          if (p.test(text)) {
            flags.push('scam_phrase')
            risk += 25
            break
          }
        }
        const domain = email.split('@')[1]
        if (domain && DISPOSABLE.some((d) => domain.includes(d))) {
          flags.push('disposable_email')
          risk += 30
        }
        if (/(.{10,})\1{2,}/.test(text)) {
          flags.push('repeated_text')
          risk += 15
        }
        risk = Math.min(100, risk)
        const trustScore = Math.max(0, 100 - risk)

        if (userId) {
          const admin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
          )
          await admin.from('ai_fraud_reports').insert({
            reporter_id: userId,
            target_type: String(payload.targetType ?? 'unknown'),
            target_id: String(payload.targetId ?? 'unknown'),
            risk_score: risk,
            trust_score: trustScore,
            flags,
            details: { textLength: text.length },
          })
        }

        return jsonResponse({
          ok: true,
          data: {
            riskScore: risk,
            trustScore,
            flags,
            moderationRecommended: risk >= 40,
            details: {},
          },
        })
      }

      case 'quote': {
        if (action !== 'estimate') break
        const slug = String(payload.categorySlug ?? 'default')
        const qty = Number(payload.quantity ?? 1) || 1
        const ranges: Record<string, [number, number]> = {
          construction: [500, 15000],
          electrical: [50, 800],
          tools: [30, 2000],
          handyman: [40, 120],
          cleaning: [60, 200],
          default: [100, 2000],
        }
        const [lo, hi] = ranges[slug] ?? ranges.default
        const minPrice = Math.round(lo * qty)
        const maxPrice = Math.round(hi * qty)
        let explanation = `Range for ${slug}`
        let confidence = 55

        if (openaiKey && payload.description) {
          const ai = await chatCompletion(
            openaiKey,
            'Return ONLY JSON: {"min":number,"max":number,"explanation":string,"confidence":number}. Currency EUR. confidence must be integer 0-100.',
            `Estimate construction job in ${payload.city}, ${payload.country}. Category: ${slug}. Qty: ${qty}. Description: ${payload.description}.`,
            undefined,
            400,
          )
          if (ai) {
            try {
              const parsed = JSON.parse(ai.replace(/```json|```/g, '').trim())
              if (parsed.min != null) {
                return jsonResponse({
                  ok: true,
                  data: {
                    minPrice: parsed.min,
                    maxPrice: parsed.max,
                    currency: String(payload.currency ?? 'EUR'),
                    explanation: parsed.explanation ?? explanation,
                    confidence: normalizeConfidence(parsed.confidence, 70),
                  },
                })
              }
            } catch { /* fallback below */ }
          }
        }

        if (userId) {
          const admin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
          )
          await admin.from('ai_quote_estimates').insert({
            user_id: userId,
            category_slug: slug,
            city: String(payload.city ?? ''),
            country: String(payload.country ?? ''),
            quantity: qty,
            unit: String(payload.unit ?? ''),
            description: String(payload.description ?? ''),
            min_price: minPrice,
            max_price: maxPrice,
            currency: String(payload.currency ?? 'EUR'),
            explanation,
            confidence,
          })
        }

        return jsonResponse({
          ok: true,
          data: { minPrice, maxPrice, currency: 'EUR', explanation, confidence },
        })
      }

      case 'ocr': {
        if (action !== 'extract') break
        const ocrText = String(payload.text ?? '')
        const amountMatch = ocrText.match(/(?:total|сума|sum)[:\s]*([\d.,]+)/i)
        const extracted = {
          companyName: ocrText.split('\n')[0]?.slice(0, 80),
          totalAmount: amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : undefined,
          currency: /€|eur/i.test(ocrText) ? 'EUR' : undefined,
        }
        if (userId && payload.storagePath) {
          const admin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
          )
          await admin.from('ai_ocr_documents').insert({
            user_id: userId,
            storage_path: String(payload.storagePath),
            mime_type: String(payload.mimeType ?? 'application/pdf'),
            status: 'processed',
            extracted,
          })
        }
        return jsonResponse({ ok: true, data: extracted })
      }

      case 'sales':
      case 'lead':
        return jsonResponse({ ok: false, error: 'use_client_engine', fallback: true }, 501)

      case 'matching':
      case 'profile':
      case 'review':
      case 'voice':
      case 'ad_image':
        return jsonResponse({
          ok: false,
          error: 'run_on_client',
          fallback: true,
          message: 'Use client-side handler or pass precomputed payload',
        }, 501)

      default:
        return jsonResponse({ ok: false, error: 'unknown_bot' }, 400)
    }

    return jsonResponse({ ok: false, error: 'unknown_action' }, 400)
  } catch (e) {
    return jsonResponse({ ok: false, error: String(e) }, 500)
  }
})
