/** LLM often returns 0–1; UI expects 0–100 percent points. */
export function normalizeConfidence(raw: unknown, fallback = 70): number {
  const n = Number(raw)
  if (!Number.isFinite(n)) return fallback
  const pct = n <= 1 ? n * 100 : n
  return Math.max(0, Math.min(100, Math.round(pct)))
}

export async function chatCompletion(
  apiKey: string,
  system: string,
  user: string,
  model?: string,
  maxTokens = 800,
): Promise<string | null> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model ?? Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  })
  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    console.error('OpenAI error', res.status, errBody.slice(0, 200))
    return null
  }
  const data = await res.json()
  return data?.choices?.[0]?.message?.content?.trim() ?? null
}

export async function translateWithOpenai(
  apiKey: string,
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<string | null> {
  const system = `Translate from ${sourceLang} to ${targetLang}. Return only the translation.`
  return chatCompletion(apiKey, system, text)
}
