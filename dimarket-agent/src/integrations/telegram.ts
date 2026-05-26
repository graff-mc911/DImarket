import type { GeneratedContent, PublishResult } from '../types.js'
import type { PlatformPublisher } from './base.js'
import { skipped } from './base.js'

export class TelegramPublisher implements PlatformPublisher {
  readonly platform = 'telegram'

  isConfigured(): boolean {
    return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHANNEL_ID)
  }

  async publish(content: GeneratedContent): Promise<PublishResult> {
    const token = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHANNEL_ID
    if (!token || !chatId) return skipped(this.platform, 'not_configured')

    const text = `${content.body}\n\n${content.hashtags.map((h) => `#${h.replace(/^#/, '')}`).join(' ')}`
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: text.slice(0, 4096), parse_mode: 'HTML' }),
    })
    const data = (await res.json()) as { ok?: boolean; result?: { message_id?: number } }
    if (!data.ok) {
      return { platform: 'telegram', success: false, error: 'telegram_api_error' }
    }
    return {
      platform: 'telegram',
      success: true,
      externalId: String(data.result?.message_id ?? ''),
    }
  }
}
