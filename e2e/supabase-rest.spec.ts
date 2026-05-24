import { test, expect } from '@playwright/test'

/**
 * Перевірка, що REST API Supabase відповідає (не 503).
 * Потрібні VITE_SUPABASE_URL і VITE_SUPABASE_ANON_KEY у .env.local або CI secrets.
 */
test.describe('Supabase REST (опційно)', () => {
  test.skip(
    !process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY,
    'Пропуск: немає VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY',
  )

  const base = `${process.env.VITE_SUPABASE_URL}/rest/v1`
  const key = process.env.VITE_SUPABASE_ANON_KEY!

  const endpoints = [
    'messages',
    'profiles?is_professional=eq.true&select=id&limit=1',
    'listings?status=eq.active&select=id&limit=1',
  ]

  for (const path of endpoints) {
    test(`${path.split('?')[0]} → не 503`, async ({ request }) => {
      const res = await request.get(`${base}/${path}`, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        timeout: 30_000,
      })

      expect(res.status(), await res.text()).not.toBe(503)
      expect(res.ok()).toBeTruthy()
    })
  }
})
