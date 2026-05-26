/** Placeholder publishers — enable when API keys are set in .env */

import type { GeneratedContent, PublishResult } from '../types.js'
import type { PlatformPublisher } from './base.js'
import { skipped } from './base.js'

function stub(platform: string, envKeys: string[]): PlatformPublisher {
  return {
    platform,
    isConfigured: () => envKeys.every((k) => Boolean(process.env[k])),
    publish: async (_content: GeneratedContent) => {
      if (!envKeys.every((k) => Boolean(process.env[k]))) {
        return skipped(platform, 'not_configured')
      }
      return skipped(platform, 'implement_graph_api_in_production')
    },
  }
}

export const instagramPublisher = stub('instagram', ['INSTAGRAM_ACCESS_TOKEN'])
export const tiktokPublisher = stub('tiktok', ['TIKTOK_ACCESS_TOKEN'])
export const googleAdsPublisher = stub('google_ads', ['GOOGLE_ADS_DEVELOPER_TOKEN', 'GOOGLE_ADS_CUSTOMER_ID'])
