/** Translation via DeepL or OpenAI fallback */

export async function translateText(
  text: string,
  targetLang: string,
  sourceLang = 'en',
): Promise<{ text: string; provider: string }> {
  const deeplKey = process.env.DEEPL_API_KEY
  if (deeplKey && sourceLang !== targetLang) {
    const res = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${deeplKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: [text],
        target_lang: targetLang.toUpperCase().slice(0, 2),
        source_lang: sourceLang.toUpperCase().slice(0, 2),
      }),
    })
    if (res.ok) {
      const data = (await res.json()) as { translations?: { text: string }[] }
      const translated = data.translations?.[0]?.text
      if (translated) return { text: translated, provider: 'deepl' }
    }
  }

  const openaiKey = process.env.OPENAI_API_KEY
  if (openaiKey && sourceLang !== targetLang) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `Translate from ${sourceLang} to ${targetLang}. Return only translation:\n\n${text}`,
          },
        ],
        max_tokens: 800,
      }),
    })
    if (res.ok) {
      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
      const translated = data.choices?.[0]?.message?.content?.trim()
      if (translated) return { text: translated, provider: 'openai' }
    }
  }

  return { text, provider: 'passthrough' }
}
