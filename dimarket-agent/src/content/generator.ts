import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { createHash } from 'node:crypto'
import { DIMARKET_KNOWLEDGE, PLATFORM_LIMITS } from '../knowledge.js'
import type { ContentKind, DiMarketRole, GeneratedContent, MarketingPlatform } from '../types.js'

export type LlmProvider = 'anthropic' | 'openai' | 'template'

export interface GenerateParams {
  role: DiMarketRole
  platform: MarketingPlatform
  languageCode: string
  countryCode: string
  kind: ContentKind
  existingHashes: string[]
}

function contentHash(text: string): string {
  return createHash('sha256').update(text.trim().toLowerCase()).digest('hex').slice(0, 32)
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, max - 1)}…`
}

function templateFallback(params: GenerateParams): GeneratedContent {
  const hooks: Record<DiMarketRole, string> = {
    client: 'Find trusted masters and companies near you',
    master: 'Grow your client base as a Master',
    company: 'Scale your business on DiMarket',
    advertiser: 'Reach thousands of users with ads on DiMarket',
  }
  const body = `${hooks[params.role]} — https://dimarket.app/ #DiMarket #${params.countryCode}`
  const limit = PLATFORM_LIMITS[params.platform] ?? 2000
  return {
    role: params.role,
    platform: params.platform,
    languageCode: params.languageCode,
    countryCode: params.countryCode,
    kind: params.kind,
    body: truncate(body, limit),
    hashtags: ['DiMarket', params.countryCode, params.role],
    charCount: Math.min(body.length, limit),
    imagePrompt: `Modern marketplace app promo for ${params.role}, ${params.countryCode}, clean UI, no text overlay`,
  }
}

async function callAnthropic(prompt: string): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return null
  const client = new Anthropic({ apiKey: key })
  const msg = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514',
    max_tokens: 1200,
    messages: [{ role: 'user', content: prompt }],
  })
  const block = msg.content[0]
  return block?.type === 'text' ? block.text.trim() : null
}

async function callOpenai(prompt: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY ?? process.env.DALLE_API_KEY
  if (!key) return null
  const client = new OpenAI({ apiKey: key })
  const res = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1200,
    temperature: 0.85,
  })
  return res.choices[0]?.message?.content?.trim() ?? null
}

function buildPrompt(params: GenerateParams): string {
  const limit = PLATFORM_LIMITS[params.platform] ?? 2000
  return `${DIMARKET_KNOWLEDGE}

Generate unique ${params.kind} for DiMarket promoting the ${params.role} role.
Target: ${params.countryCode}, language: ${params.languageCode}, platform: ${params.platform}.
Max characters for body: ${limit}.
Cultural tone appropriate for the region. Include 3-8 relevant hashtags.
Return JSON only: {"body":"","hashtags":[],"title":"","imagePrompt":""}
Do not repeat prior campaigns. Be fresh and specific.`
}

function parseJson(raw: string): Partial<GeneratedContent> | null {
  try {
    const m = raw.match(/\{[\s\S]*\}/)
    if (!m) return null
    return JSON.parse(m[0]) as Partial<GeneratedContent>
  } catch {
    return null
  }
}

export async function generateMarketingContent(
  params: GenerateParams,
): Promise<{ content: GeneratedContent; provider: LlmProvider; hash: string }> {
  const prompt = buildPrompt(params)
  let raw =
    (await callAnthropic(prompt)) ??
    (await callOpenai(prompt))

  let provider: LlmProvider = raw ? (process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'openai') : 'template'
  if (!raw) {
    const t = templateFallback(params)
    return { content: t, provider: 'template', hash: contentHash(t.body) }
  }

  const parsed = parseJson(raw)
  const limit = PLATFORM_LIMITS[params.platform] ?? 2000
  const body = truncate(String(parsed?.body ?? raw), limit)
  const hash = contentHash(body)

  if (params.existingHashes.includes(hash)) {
    const retry = await generateMarketingContent({
      ...params,
      existingHashes: [...params.existingHashes, hash],
    })
    return retry
  }

  const content: GeneratedContent = {
    role: params.role,
    platform: params.platform,
    languageCode: params.languageCode,
    countryCode: params.countryCode,
    kind: params.kind,
    title: parsed?.title ? String(parsed.title) : undefined,
    body,
    hashtags: Array.isArray(parsed?.hashtags)
      ? (parsed.hashtags as string[]).map(String).slice(0, 12)
      : [],
    imagePrompt: parsed?.imagePrompt ? String(parsed.imagePrompt) : undefined,
    charCount: body.length,
  }

  return { content, provider, hash }
}

export { contentHash }
