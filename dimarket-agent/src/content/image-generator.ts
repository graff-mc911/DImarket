/** DALL-E 3 image prompt → URL (stored externally by caller) */

export async function generateImageUrl(prompt: string): Promise<string | null> {
  const key = process.env.DALLE_API_KEY ?? process.env.OPENAI_API_KEY
  if (!key) return null

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt.slice(0, 1000),
      n: 1,
      size: '1024x1024',
    }),
  })

  if (!res.ok) return null
  const data = (await res.json()) as { data?: { url?: string }[] }
  return data.data?.[0]?.url ?? null
}
