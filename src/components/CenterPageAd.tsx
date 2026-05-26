import { useEffect, useMemo } from 'react'
import { usePaidAds } from '../contexts/PaidAdsContext'
import { AdOverlayCard } from './AdOverlayCard'
import { pickCenterHeroCampaign, pickMobileCampaign, getCampaignPlacements, trackAdImpression } from '../lib/adCampaigns'
import { centerSlotId, mobileInlineSlotId, pageKeyFromSideAdsPage } from '../lib/adPlacementSlots'
import type { SideAdsPage } from './PageWithSideAds'

type CenterPageAdProps = {
  page: SideAdsPage
  className?: string
}

/** Центральний банер у контенті (desktop/tablet); не показуємо на вузьких екранах — там inline-слоти */
export function CenterPageAd({ page, className = '' }: CenterPageAdProps) {
  const { loading, getForSlots } = usePaidAds()
  const pageKey = pageKeyFromSideAdsPage(page)

  const slotIds = useMemo(
    () => [centerSlotId(pageKey), mobileInlineSlotId(pageKey, 1)],
    [pageKey],
  )

  const pool = useMemo(() => getForSlots(slotIds, 16), [getForSlots, slotIds])

  const campaign = useMemo(() => {
    const center = pickCenterHeroCampaign(pool, pageKey)
    if (center) return center
    return pickMobileCampaign(pool, 'horizontal', pageKey, 1)
  }, [pool, pageKey])

  useEffect(() => {
    if (loading || !campaign) return
    void trackAdImpression(campaign.id)
  }, [loading, campaign])

  if (loading || !campaign) return null

  const slotId =
    slotIds.find((id) => getCampaignPlacements(campaign).includes(id)) ?? slotIds[0]

  return (
    <section className={`hidden md:block ${className}`}>
      <div className="flex justify-center">
        <AdOverlayCard
          campaign={campaign}
          slotId={slotId}
          variant="center"
          className="w-full"
          showDescription
        />
      </div>
    </section>
  )
}
