import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://wjlfvajloxkevggwjgtk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqbGZ2YWpsb3hrZXZnZ3dqZ3RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjExOTgsImV4cCI6MjA5Mjc5NzE5OH0.zX0syn4YYt6IhqeQpROT71y2J7dhvm9VfsazgMg46GA',
)

const { data } = await supabase
  .from('ad_campaigns')
  .select('*')
  .eq('status', 'active')
  .order('price_paid', { ascending: false })
  .limit(40)

const slots = ['home', 'sidebar', 'listings', 'mobile_sticky', 'footer']
const isPaid = (c) =>
  !!(c.stripe_payment_id || (c.price_paid != null && Number(c.price_paid) > 0) || c.approved_by)
const inSched = (c) => {
  const n = Date.now()
  const s = c.starts_at ? new Date(c.starts_at).getTime() : null
  const e = c.ends_at ? new Date(c.ends_at).getTime() : null
  return (s === null || s <= n) && (e === null || e >= n)
}
const getPl = (c) => {
  const a = (c.placements || []).filter(Boolean)
  return a.length ? a : [c.placement]
}
const fb = {
  sidebar: ['sidebar', 'footer', 'home', 'listings'],
  mobile_sticky: ['mobile_sticky', 'home', 'listings', 'sidebar', 'footer'],
  home: ['home', 'sidebar', 'listings', 'mobile_sticky', 'footer'],
  listings: ['listings', 'home', 'sidebar', 'mobile_sticky', 'footer'],
  footer: ['footer', 'sidebar', 'home', 'listings'],
}
const match = (c, slot) => {
  const p = getPl(c)
  if (p.includes(slot)) return true
  const f = fb[slot]
  return f?.some((x) => p.includes(x))
}
const geo = (c) => {
  const scope = c.geo_scope
  if (!scope || scope === 'global' || scope === 'countries') return true
  return true
}

const r = data[0]
console.log('row0', {
  title: r?.title,
  placement: r?.placement,
  placements: r?.placements,
  geo: r?.geo_scope,
  paid: isPaid(r),
  sched: inSched(r),
  slotHits: slots.filter((s) => match(r, s)),
})

const filtered = data
  .filter(isPaid)
  .filter(inSched)
  .filter((c) => slots.some((s) => match(c, s)))
  .filter(geo)

console.log('raw', data.length, 'filtered', filtered.length)
