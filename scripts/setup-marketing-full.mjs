#!/usr/bin/env node
/**
 * Full marketing agent setup:
 * - migration (automation + announcements)
 * - MARKETING_CRON_SECRET → Supabase secrets + .env.local
 * - pg_cron schedule (hourly check, respects frequency in edge)
 * - deploy marketing-agent + run first cycle
 *
 * node scripts/setup-marketing-full.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { randomBytes } from 'crypto'
import { spawnSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const projectRef = 'wjlfvajloxkevggwjgtk'
const supabaseUrl = `https://${projectRef}.supabase.co`

function loadEnvFile(name) {
  const path = resolve(root, name)
  if (!existsSync(path)) return {}
  const out = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 1) continue
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '')
  }
  return out
}

function appendEnvLocal(key, value) {
  const path = resolve(root, '.env.local')
  const line = `${key}=${value}`
  if (!existsSync(path)) {
    writeFileSync(path, line + '\n', 'utf8')
    return
  }
  const raw = readFileSync(path, 'utf8')
  const re = new RegExp(`^${key}=.*$`, 'm')
  if (re.test(raw)) {
    writeFileSync(path, raw.replace(re, line), 'utf8')
  } else {
    writeFileSync(path, raw.trimEnd() + '\n' + line + '\n', 'utf8')
  }
}

async function runSql(token, sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })
  const text = await res.text()
  if (!res.ok) {
    console.error('SQL error', res.status, text.slice(0, 500))
    return false
  }
  return true
}

const env = { ...loadEnvFile('.env'), ...loadEnvFile('.env.local'), ...process.env }
const token = env.SUPABASE_ACCESS_TOKEN
if (!token) {
  console.error('SUPABASE_ACCESS_TOKEN required in .env.local')
  process.exit(1)
}

let cronSecret = env.MARKETING_CRON_SECRET?.trim()
if (!cronSecret) {
  cronSecret = randomBytes(24).toString('hex')
  appendEnvLocal('MARKETING_CRON_SECRET', cronSecret)
  console.log('Generated MARKETING_CRON_SECRET → .env.local')
}

console.log('1/5 Applying automation migration...')
const migPath = resolve(root, 'supabase/migrations/20260630120000_marketing_agent_automation.sql')
if (!(await runSql(token, readFileSync(migPath, 'utf8')))) process.exit(1)

console.log('2/5 Scheduling pg_cron (hourly)...')
const cronSql = `
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'marketing_agent_hourly';
SELECT cron.schedule(
  'marketing_agent_hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := '${supabaseUrl}/functions/v1/marketing-agent',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '${cronSecret}'
    ),
    body := '{"action":"cron_run"}'::jsonb
  ) AS request_id;
  $$
);
`
if (!(await runSql(token, cronSql))) {
  console.warn('pg_cron schedule failed — use GitHub Actions workflow as fallback')
}

console.log('3/5 Supabase secrets + deploy...')
const secretArgs = [`MARKETING_CRON_SECRET=${cronSecret}`]
if (env.OPENAI_API_KEY?.trim()) secretArgs.push(`OPENAI_API_KEY=${env.OPENAI_API_KEY.trim()}`)
if (env.OPENAI_MODEL?.trim()) secretArgs.push(`OPENAI_MODEL=${env.OPENAI_MODEL.trim()}`)
if (env.TELEGRAM_BOT_TOKEN?.trim()) secretArgs.push(`TELEGRAM_BOT_TOKEN=${env.TELEGRAM_BOT_TOKEN.trim()}`)
if (env.TELEGRAM_CHANNEL_ID?.trim()) secretArgs.push(`TELEGRAM_CHANNEL_ID=${env.TELEGRAM_CHANNEL_ID.trim()}`)
if (env.ANTHROPIC_API_KEY?.trim()) secretArgs.push(`ANTHROPIC_API_KEY=${env.ANTHROPIC_API_KEY.trim()}`)

const sec = spawnSync('npx', ['supabase', 'secrets', 'set', ...secretArgs, '--project-ref', projectRef], {
  stdio: 'inherit',
  shell: true,
  cwd: root,
})
if (sec.status !== 0) process.exit(sec.status ?? 1)

const dep = spawnSync('npx', ['supabase', 'functions', 'deploy', 'marketing-agent', '--project-ref', projectRef], {
  stdio: 'inherit',
  shell: true,
  cwd: root,
})
if (dep.status !== 0) process.exit(dep.status ?? 1)

console.log('4/5 First marketing cycle...')
const cronRes = await fetch(`${supabaseUrl}/functions/v1/marketing-agent`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-cron-secret': cronSecret,
  },
  body: JSON.stringify({ action: 'cron_run', payload: { force: true } }),
})

let cronData = {}
try {
  cronData = await cronRes.json()
} catch { /* */ }

if (!cronRes.ok && cronData?.data?.reason !== 'not_due') {
  console.warn('cron_run response', cronRes.status, cronData)
}

if (cronData?.data?.reason === 'not_due') {
  console.log('Cycle skipped (not due). Forcing run_cycle via service role...')
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceKey) {
    const force = await fetch(`${supabaseUrl}/functions/v1/marketing-agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ action: 'cron_run' }),
    })
    console.log('Force status', force.status, await force.text())
  }
}

console.log('5/5 Done.')
console.log(`
Marketing agent is ON (auto_publish + blog banners on dimarket.app).

Optional Telegram — add to .env.local then re-run:
  TELEGRAM_BOT_TOKEN=...
  TELEGRAM_CHANNEL_ID=...
  node scripts/setup-marketing-full.mjs

Dashboard: https://dimarket.app/admin/marketing-agent
`)
