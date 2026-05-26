import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { CampaignMetrics, MarketingPlatform } from '../types.js'

let supabase: SupabaseClient | null = null

function db(): SupabaseClient | null {
  if (supabase) return supabase
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  supabase = createClient(url, key)
  return supabase
}

export async function trackEvent(
  event: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const client = db()
  if (!client) return
  await client.from('marketing_analytics').insert({
    event_type: event,
    payload,
  })
}

export async function recordPublish(
  postId: string,
  platform: MarketingPlatform,
  success: boolean,
): Promise<void> {
  await trackEvent('publish', { postId, platform, success })
}

export async function aggregateMetrics(campaignId: string): Promise<CampaignMetrics> {
  const client = db()
  if (!client) {
    return { impressions: 0, clicks: 0, conversions: 0, spend_usd: 0 }
  }
  const { data } = await client
    .from('marketing_analytics')
    .select('payload')
    .eq('campaign_id', campaignId)

  let impressions = 0
  let clicks = 0
  let conversions = 0
  let spend_usd = 0
  for (const row of data ?? []) {
    const p = row.payload as Record<string, number>
    impressions += p.impressions ?? 0
    clicks += p.clicks ?? 0
    conversions += p.conversions ?? 0
    spend_usd += p.spend_usd ?? 0
  }
  return { impressions, clicks, conversions, spend_usd }
}
