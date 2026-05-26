import type { GeneratedContent, PublishResult } from '../types.js'
import type { PlatformPublisher } from './base.js'
import { skipped } from './base.js'

export class LinkedInPublisher implements PlatformPublisher {
  readonly platform = 'linkedin'

  isConfigured(): boolean {
    return Boolean(process.env.LINKEDIN_ACCESS_TOKEN && process.env.LINKEDIN_ORG_URN)
  }

  async publish(content: GeneratedContent): Promise<PublishResult> {
    if (!this.isConfigured()) return skipped(this.platform, 'not_configured')
    return skipped(this.platform, 'use_linkedin_marketing_api_from_dashboard')
  }
}
