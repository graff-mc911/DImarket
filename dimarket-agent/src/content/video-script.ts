import type { DiMarketRole } from '../types.js'

export function buildShortVideoScript(
  role: DiMarketRole,
  languageCode: string,
  countryCode: string,
): string {
  const scenes: Record<DiMarketRole, string[]> = {
    client: [
      'HOOK (0-2s): Need a trusted pro near you?',
      'PROBLEM (2-5s): Random ads ≠ real reviews.',
      'SOLUTION (5-12s): DiMarket — masters & companies in one app.',
      'CTA (12-15s): Open dimarket.app — order in minutes.',
    ],
    master: [
      'HOOK: Tired of chasing clients?',
      'VALUE: DiMarket brings orders to your profile.',
      'PROOF: Ratings, chat, local demand.',
      'CTA: Register as Master on dimarket.app',
    ],
    company: [
      'HOOK: Scale service sales without chaos.',
      'VALUE: Company profile + marketplace reach.',
      'CTA: Add your company on dimarket.app',
    ],
    advertiser: [
      'HOOK: Your brand in front of active buyers.',
      'VALUE: DiMarket ads — geo + role targeting.',
      'CTA: Advertise at dimarket.app',
    ],
  }

  return [
    `# TikTok/Reels/Shorts — ${role} — ${countryCode} (${languageCode})`,
    ...scenes[role],
    'On-screen text: DiMarket | dimarket.app',
    'Music: upbeat, royalty-free',
  ].join('\n')
}
