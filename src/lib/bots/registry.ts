import type { BotId } from './types'

export type BotDefinition = {
  id: BotId
  path?: string
  /** Edge action prefix */
  actions: string[]
  requiresAuth?: boolean
  adminOnly?: boolean
}

/** Реєстр усіх ботів Dimarket */
export const BOT_REGISTRY: Record<BotId, BotDefinition> = {
  sales: {
    id: 'sales',
    path: '/assistant/job',
    actions: ['chat', 'publish'],
  },
  matching: {
    id: 'matching',
    actions: ['rank'],
  },
  translation: {
    id: 'translation',
    actions: ['translate'],
  },
  fraud: {
    id: 'fraud',
    actions: ['scan'],
    adminOnly: false,
  },
  quote: {
    id: 'quote',
    actions: ['estimate'],
  },
  ocr: {
    id: 'ocr',
    actions: ['extract'],
    requiresAuth: true,
  },
  profile: {
    id: 'profile',
    actions: ['analyze'],
    requiresAuth: true,
  },
  review: {
    id: 'review',
    actions: ['analyze'],
  },
  lead: {
    id: 'lead',
    path: '/assistant/job',
    actions: ['qualify', 'chat'],
  },
  voice: {
    id: 'voice',
    actions: ['transcribe'],
  },
  messaging: {
    id: 'messaging',
    actions: ['register_webhook', 'status'],
    adminOnly: true,
  },
  ad_image: {
    id: 'ad_image',
    actions: ['register', 'complete_variants'],
    requiresAuth: true,
  },
}

export const BOT_IDS = Object.keys(BOT_REGISTRY) as BotId[]
