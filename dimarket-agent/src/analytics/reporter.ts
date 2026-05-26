import type { CampaignMetrics } from '../types.js'

export function formatMetricsReport(
  campaignName: string,
  metrics: CampaignMetrics,
): string {
  const ctr =
    metrics.impressions > 0
      ? ((metrics.clicks / metrics.impressions) * 100).toFixed(2)
      : '0.00'
  const cvr =
    metrics.clicks > 0
      ? ((metrics.conversions / metrics.clicks) * 100).toFixed(2)
      : '0.00'

  return [
    `# Marketing report — ${campaignName}`,
    `Impressions: ${metrics.impressions}`,
    `Clicks: ${metrics.clicks} (CTR ${ctr}%)`,
    `Conversions: ${metrics.conversions} (CVR ${cvr}%)`,
    `Spend: $${metrics.spend_usd.toFixed(2)}`,
    `Generated: ${new Date().toISOString()}`,
  ].join('\n')
}
