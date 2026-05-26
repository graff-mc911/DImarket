import { ROLE_ROTATION } from '../knowledge.js'
import type { AgentConfig, DiMarketRole, MarketTarget, MarketingPlatform } from '../types.js'

export interface PlannedSlot {
  role: DiMarketRole
  market: MarketTarget
  platform: MarketingPlatform
}

/** Build daily content plan: rotate roles × markets × platforms */
export function planDailySlots(config: AgentConfig, maxSlots = 24): PlannedSlot[] {
  const markets = config.target_markets.length ? config.target_markets : []
  const platforms = config.platforms.length ? config.platforms : (['telegram', 'facebook'] as MarketingPlatform[])
  if (!markets.length || !platforms.length) return []

  const slots: PlannedSlot[] = []
  let roleIdx = config.next_role_index % ROLE_ROTATION.length

  for (let i = 0; i < maxSlots; i++) {
    const market = markets[i % markets.length]
    const platform = platforms[i % platforms.length]
    const role = ROLE_ROTATION[roleIdx % ROLE_ROTATION.length] as DiMarketRole
    slots.push({ role, market, platform })
    roleIdx++
    if ((i + 1) % platforms.length === 0) roleIdx++
  }

  return slots
}

export function nextRoleIndex(current: number, slotsGenerated: number): number {
  return (current + slotsGenerated) % ROLE_ROTATION.length
}
