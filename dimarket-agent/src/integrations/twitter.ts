import type { GeneratedContent, PublishResult } from '../types.js'
import type { PlatformPublisher } from './base.js'
import { skipped } from './base.js'

/** X/Twitter v2 — requires OAuth1 user context or bearer + user id */
export class TwitterPublisher implements PlatformPublisher {
  readonly platform = 'twitter'

  isConfigured(): boolean {
    return Boolean(
      process.env.TWITTER_API_KEY &&
        process.env.TWITTER_ACCESS_TOKEN &&
        process.env.TWITTER_ACCESS_SECRET,
    )
  }

  async publish(content: GeneratedContent): Promise<PublishResult> {
    if (!this.isConfigured()) return skipped(this.platform, 'not_configured')
    // Full OAuth1 signing omitted — store draft; production uses official SDK
    return skipped(this.platform, 'oauth_signing_required_use_dashboard_preview')
  }
}
