/**
 * Product feature flags — keep incomplete / deferred surfaces off in production UI.
 * Project escrow + Connect payouts: deferred until audience justifies money loop.
 */
export const PROJECT_PAYMENTS_ENABLED = false

/**
 * Paid self-serve ads (Stripe checkout for ad_campaign).
 * While false: advertisers save/publish campaigns directly (no payment).
 */
export const AD_PAYMENTS_ENABLED = false

/** Commercial Agents B2B marketplace (manufacturers ↔ representatives). */
export { COMMERCIAL_AGENTS_ENABLED } from './commercialAgents/plans'
