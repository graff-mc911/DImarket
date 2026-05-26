#!/usr/bin/env node
/** Manual cron trigger — uses MARKETING_CRON_SECRET from .env.local */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = resolve(root, '.env.local')
if (!existsSync(envPath)) {
  console.error('Missing .env.local with MARKETING_CRON_SECRET')
  process.exit(1)
}
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i), l.slice(i + 1)]
    }),
)
const secret = env.MARKETING_CRON_SECRET
if (!secret) {
  console.error('MARKETING_CRON_SECRET missing — run: npm run marketing:setup')
  process.exit(1)
}

const res = await fetch(
  'https://wjlfvajloxkevggwjgtk.supabase.co/functions/v1/marketing-agent',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-cron-secret': secret,
    },
    body: JSON.stringify({ action: 'cron_run', payload: { force: true } }),
  },
)
console.log(res.status, await res.text())
