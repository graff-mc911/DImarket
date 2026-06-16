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
const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

const { data, error } = await sb.from('app_site_stats').select('*').eq('id', 1).maybeSingle()
console.log('app_site_stats error:', error?.message || 'ok')
console.log('country_ranking:', JSON.stringify(data?.country_ranking, null, 2))
console.log('updated_at:', data?.updated_at)

const { data: profiles } = await sb
  .from('profiles')
  .select('location, is_professional')
  .eq('is_professional', true)
console.log('pro locations:', profiles)
