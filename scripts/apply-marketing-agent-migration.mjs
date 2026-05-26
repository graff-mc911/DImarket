#!/usr/bin/env node
/**
 * Apply marketing_agent migration via Supabase Management API (optional).
 * Prefer: supabase db push
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const sqlPath = join(__dirname, '../supabase/migrations/20260629120000_marketing_agent.sql')
const projectRef = process.env.SUPABASE_PROJECT_REF ?? 'wjlfvajloxkevggwjgtk'
const token = process.env.SUPABASE_ACCESS_TOKEN

if (!token) {
  console.error('Set SUPABASE_ACCESS_TOKEN to apply migration, or run: supabase db push')
  process.exit(1)
}

const sql = readFileSync(sqlPath, 'utf8')
const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: sql }),
})

if (!res.ok) {
  console.error('Migration failed', res.status, await res.text())
  process.exit(1)
}
console.log('Marketing agent migration applied.')
