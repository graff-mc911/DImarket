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
