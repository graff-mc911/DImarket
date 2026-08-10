/**
 * Product feature flags — keep incomplete / deferred surfaces off in production UI.
 * Project escrow + Connect payouts: deferred until audience justifies money loop.
 */
export const PROJECT_PAYMENTS_ENABLED = false

/** Commercial Agents B2B marketplace (manufacturers ↔ representatives). */
export { COMMERCIAL_AGENTS_ENABLED } from './commercialAgents/plans'
