import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://wjlfvajloxkevggwjgtk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqbGZ2YWpsb3hrZXZnZ3dqZ3RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjExOTgsImV4cCI6MjA5Mjc5NzE5OH0.zX0syn4YYt6IhqeQpROT71y2J7dhvm9VfsazgMg46GA',
)

const selectWithAdvertiser = `
  *,
  advertiser:profiles!advertiser_id (
    full_name,
    website,
    avatar_url,
    profile_photo,
    user_role
  )
`

let { data, error } = await supabase
  .from('ad_campaigns')
  .select(selectWithAdvertiser)
  .eq('status', 'active')
  .order('price_paid', { ascending: false, nullsFirst: false })
  .order('created_at', { ascending: false })
  .limit(40)

console.log('join error:', error?.message || 'none')
console.log('join count:', data?.length ?? 0)

if (error) {
  const retry = await supabase.from('ad_campaigns').select('*').eq('status', 'active').limit(40)
  console.log('retry error:', retry.error?.message || 'none')
  data = retry.data
  error = retry.error
}

const slots = ['mobile_sticky', 'home', 'sidebar']
const isPaid = (c) =>
  !!(c.stripe_payment_id || (c.price_paid != null && Number(c.price_paid) > 0) || c.approved_by)
const inSchedule = (c) => {
  const now = Date.now()
  const s = c.starts_at ? new Date(c.starts_at).getTime() : null
  const e = c.ends_at ? new Date(c.ends_at).getTime() : null
  return (s === null || s <= now) && (e === null || e >= now)
}
const matchSlot = (c, slot) => {
  const fromArray = (c.placements || []).filter(Boolean)
  const placements = fromArray.length > 0 ? fromArray : [c.placement]
  if (placements.includes(slot)) return true
  if (slot === 'sidebar') return placements.some((p) => ['sidebar', 'footer', 'home'].includes(p))
  if (slot === 'mobile_sticky')
    return placements.some((p) => ['mobile_sticky', 'home', 'listings', 'sidebar'].includes(p))
  return false
}

const filtered = (data || [])
  .filter(isPaid)
  .filter(inSchedule)
  .filter((c) => slots.some((s) => matchSlot(c, s)))

console.log('filtered count:', filtered.length)
for (const c of filtered) {
  console.log('-', c.title, '| placement:', c.placement, '| paid:', c.stripe_payment_id)
}
