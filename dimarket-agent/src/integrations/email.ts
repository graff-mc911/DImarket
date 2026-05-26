import type { GeneratedContent, PublishResult } from '../types.js'
import type { PlatformPublisher } from './base.js'
import { skipped } from './base.js'

export class EmailPublisher implements PlatformPublisher {
  readonly platform = 'email'

  isConfigured(): boolean {
    return Boolean(process.env.SENDGRID_API_KEY || process.env.MAILCHIMP_API_KEY)
  }

  async publish(content: GeneratedContent): Promise<PublishResult> {
    const sg = process.env.SENDGRID_API_KEY
    const to = process.env.MARKETING_EMAIL_LIST
    if (!sg || !to) return skipped(this.platform, 'not_configured')

    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sg}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: process.env.MARKETING_FROM_EMAIL ?? 'marketing@dimarket.app' },
        subject: content.title ?? 'DiMarket — marketplace update',
        content: [{ type: 'text/plain', value: content.body }],
      }),
    })

    if (!res.ok) {
      return { platform: 'email', success: false, error: `sendgrid_${res.status}` }
    }
    return { platform: 'email', success: true }
  }
}
