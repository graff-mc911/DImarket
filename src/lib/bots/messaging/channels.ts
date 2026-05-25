/**
 * Шар інтеграції Telegram / WhatsApp (без продакшн-токенів).
 * TODO: TELEGRAM_BOT_TOKEN, WHATSAPP_ACCESS_TOKEN у Supabase secrets.
 */

export type MessagingChannel = 'telegram' | 'whatsapp'

export type ChannelStatus = {
  channel: MessagingChannel
  configured: boolean
  webhookUrl: string | null
  docs: string
}

export function getMessagingChannelStatus(): ChannelStatus[] {
  return [
    {
      channel: 'telegram',
      configured: false,
      webhookUrl: null,
      docs: 'https://core.telegram.org/bots/api#setwebhook',
    },
    {
      channel: 'whatsapp',
      configured: false,
      webhookUrl: null,
      docs: 'https://developers.facebook.com/docs/whatsapp/cloud-api',
    },
  ]
}

export type WebhookPayloadPlaceholder = {
  channel: MessagingChannel
  externalChatId: string
  text: string
  metadata?: Record<string, unknown>
}

/** Заглушка обробника вхідного повідомлення */
export function handleInboundPlaceholder(payload: WebhookPayloadPlaceholder): {
  accepted: boolean
  reply: string
} {
  return {
    accepted: true,
    reply: `[${payload.channel}] Integration pending. Message: ${payload.text.slice(0, 80)}`,
  }
}
