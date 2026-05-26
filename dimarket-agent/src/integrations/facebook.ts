import type { GeneratedContent, PublishResult } from '../types.js'
import type { PlatformPublisher } from './base.js'
import { skipped } from './base.js'

export class FacebookPublisher implements PlatformPublisher {
  readonly platform = 'facebook'

  isConfigured(): boolean {
    return Boolean(process.env.FACEBOOK_ACCESS_TOKEN && process.env.FACEBOOK_PAGE_ID)
  }

  async publish(content: GeneratedContent): Promise<PublishResult> {
    const token = process.env.FACEBOOK_ACCESS_TOKEN
    const pageId = process.env.FACEBOOK_PAGE_ID
    if (!token || !pageId) return skipped(this.platform, 'not_configured')

    const message = `${content.body}\n${content.hashtags.map((h) => `#${h.replace(/^#/, '')}`).join(' ')}`
    const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, access_token: token }),
    })
    const data = (await res.json()) as { id?: string; error?: { message?: string } }
    if (!res.ok || data.error) {
      return { platform: 'facebook', success: false, error: data.error?.message ?? 'facebook_error' }
    }
    return { platform: 'facebook', success: true, externalId: data.id }
  }
}
