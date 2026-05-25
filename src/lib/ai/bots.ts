/** Реєстр AI-ботів Dimarket (розширюється). */

export type AiBotId = 'sales'

export type AiBotConfig = {
  id: AiBotId
  path: string
  /** Таблиця сесій: bot_type */
  botType: string
}

export const AI_BOTS: Record<AiBotId, AiBotConfig> = {
  sales: {
    id: 'sales',
    path: '/assistant/job',
    botType: 'sales',
  },
}
