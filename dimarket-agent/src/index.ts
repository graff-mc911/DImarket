/**
 * DiMarket Marketing Agent — background worker
 * Run: npm run build && npm start
 * Requires REDIS_URL + SUPABASE_* for full automation
 */

import { MarketingAgent } from './core/agent.js'
import { startPublishWorker } from './core/scheduler.js'
import { integrationStatus } from './integrations/index.js'

async function main() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const agent = new MarketingAgent(url, key)
  console.log('Integration status:', integrationStatus())

  startPublishWorker(async (postId) => {
    await agent.publishPostById(postId)
  })

  const enabled = process.env.MARKETING_AGENT_ENABLED !== 'false'
  if (enabled) {
    const result = await agent.runCycle()
    console.log('Cycle complete:', result)
  }

  // Keep worker alive for BullMQ
  if (process.env.REDIS_URL) {
    console.log('Worker listening on marketing-posts queue')
  } else {
    console.log('REDIS_URL not set — one-shot cycle only')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
