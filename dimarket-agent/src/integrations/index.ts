import type { MarketingPlatform } from '../types.js'
import type { PlatformPublisher } from './base.js'
import { FacebookPublisher } from './facebook.js'
import { TelegramPublisher } from './telegram.js'
import { TwitterPublisher } from './twitter.js'
import { LinkedInPublisher } from './linkedin.js'
import { EmailPublisher } from './email.js'

const publishers: PlatformPublisher[] = [
  new TelegramPublisher(),
  new FacebookPublisher(),
  new TwitterPublisher(),
  new LinkedInPublisher(),
  new EmailPublisher(),
]

export function getPublisher(platform: MarketingPlatform): PlatformPublisher | undefined {
  return publishers.find((p) => p.platform === platform)
}

export function integrationStatus(): { platform: string; configured: boolean }[] {
  return publishers.map((p) => ({ platform: p.platform, configured: p.isConfigured() }))
}
