import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

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

const env = { ...loadEnvFile('.env'), ...loadEnvFile('.env.local'), ...process.env }
const url = env.VITE_SUPABASE_URL || 'https://wjlfvajloxkevggwjgtk.supabase.co'
const anon = env.VITE_SUPABASE_ANON_KEY

const sb = createClient(url, anon)
const rpc = await sb.rpc('get_public_footer_stats')
console.log('get_public_footer_stats:', rpc.error?.message || 'ok', rpc.data)

const { count, error } = await sb
  .from('profiles')
  .select('*', { count: 'exact', head: true })
  .eq('is_professional', true)
console.log('anon professionals count:', count, error?.message || '')
