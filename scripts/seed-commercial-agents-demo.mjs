/**
 * Idempotent demo seed for Commercial Agents (service_role).
 * Creates published manufacturer + agent + opportunity so directories are not empty.
 *
 * Env:
 *   VITE_SUPABASE_URL / SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * node scripts/seed-commercial-agents-demo.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

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
const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Need VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(2)
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const DEMO_PASSWORD = 'DemoCA-ChangeMe-2026!'

/** Stable ids so re-runs stay idempotent without listing all auth users. */
const DEMO_MFR_USER_ID = 'a1111111-ca01-4111-8111-111111111101'
const DEMO_AGENT_USER_ID = 'a1111111-ca01-4111-8111-111111111102'

const demos = [
  {
    id: DEMO_MFR_USER_ID,
    email: 'demo.manufacturer.ca@dimarket.app',
    full_name: 'Demo HVAC Manufacturer',
    role: 'company',
  },
  {
    id: DEMO_AGENT_USER_ID,
    email: 'demo.agent.ca@dimarket.app',
    full_name: 'Demo Commercial Agent',
    role: 'professional',
  },
]

async function ensureUser({ id, email, full_name, role }) {
  const { data, error } = await admin.auth.admin.createUser({
    id,
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name, demo_commercial_agents: true },
  })
  if (error && !/already|registered|exists|duplicate/i.test(error.message)) {
    throw error
  }
  if (data?.user) console.log('created auth user', email)
  else console.log('auth user exists or reused', email, id)

  const { error: profileErr } = await admin.from('profiles').upsert(
    {
      id,
      full_name,
      user_role: role,
      is_professional: role === 'professional',
      is_site_owner: false,
      bio: 'Demo profile for Commercial Agents marketplace.',
      location: 'Madrid, Spain',
    },
    { onConflict: 'id' },
  )
  if (profileErr) throw profileErr
  return id
}

const mfrId = await ensureUser(demos[0])
const agentUserId = await ensureUser(demos[1])

const { data: mfr, error: mfrErr } = await admin
  .from('manufacturer_profiles')
  .upsert(
    {
      profile_id: mfrId,
      slug: 'demo-iberia-hvac-systems',
      company_name: 'Iberia HVAC Systems (Demo)',
      description:
        'Demo manufacturer seeking commercial agents across Spain and Portugal for HVAC and climate systems.',
      website: 'https://dimarket.app/commercial-agents',
      country: 'Spain',
      headquarters: 'Madrid',
      categories: ['hvac', 'construction'],
      products: ['Heat pumps', 'VRV systems'],
      target_markets: ['Spain', 'Portugal'],
      countries_available: ['Spain', 'Portugal'],
      languages: ['ES', 'EN', 'PT'],
      minimum_experience_years: 3,
      exclusive_representation: false,
      non_exclusive_representation: true,
      agent_required: true,
      verification_status: 'verified',
      is_published: true,
      show_public_contacts: false,
    },
    { onConflict: 'profile_id' },
  )
  .select('*')
  .single()
if (mfrErr) throw mfrErr
console.log('manufacturer', mfr.slug)

const { data: agent, error: agentErr } = await admin
  .from('agent_profiles')
  .upsert(
    {
      profile_id: agentUserId,
      slug: 'demo-sofia-commercial-agent',
      full_name: 'Sofía Mendes (Demo)',
      company_name: 'Mendes Representation',
      description:
        'Demo independent commercial agent covering Iberia — HVAC, construction materials, and store fit-out.',
      country: 'Spain',
      city: 'Barcelona',
      service_regions: ['Spain', 'Portugal'],
      languages: ['ES', 'EN', 'PT'],
      categories: ['hvac', 'stores', 'construction'],
      years_experience: 8,
      available_for_new_brands: true,
      verification_status: 'verified',
      is_published: true,
      show_public_contacts: false,
    },
    { onConflict: 'profile_id' },
  )
  .select('*')
  .single()
if (agentErr) throw agentErr
console.log('agent', agent.slug)

const { data: existingOpp } = await admin
  .from('representation_opportunities')
  .select('id')
  .eq('manufacturer_id', mfr.id)
  .eq('title', 'HVAC commercial agent — Spain & Portugal (Demo)')
  .maybeSingle()

let oppId = existingOpp?.id
if (!oppId) {
  const { data: opp, error: oppErr } = await admin
    .from('representation_opportunities')
    .insert({
      manufacturer_id: mfr.id,
      title: 'HVAC commercial agent — Spain & Portugal (Demo)',
      description:
        'Looking for an experienced commercial agent to open dealer channels for heat pumps and VRV. Demo opportunity for DImarket Commercial Agents.',
      category: 'hvac',
      products: ['Heat pumps', 'VRV'],
      target_country: 'Spain',
      target_regions: ['Catalonia', 'Madrid', 'Lisbon'],
      required_languages: ['ES', 'EN'],
      commission_range: '8–12%',
      exclusive: false,
      remote_possible: true,
      travel_required: true,
      status: 'published',
    })
    .select('id')
    .single()
  if (oppErr) throw oppErr
  oppId = opp.id
  console.log('opportunity created', oppId)
} else {
  console.log('opportunity exists', oppId)
}

console.log('Commercial Agents demo seed OK')
console.log(
  JSON.stringify(
    {
      manufacturer: `/commercial-agents/manufacturers/${mfr.slug}`,
      agent: `/commercial-agents/representatives/${agent.slug}`,
      opportunity: `/commercial-agents/opportunities/${oppId}`,
    },
    null,
    2,
  ),
)
