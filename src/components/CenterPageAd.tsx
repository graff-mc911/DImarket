import { useEffect, useMemo } from 'react'
import { usePaidAds } from '../contexts/PaidAdsContext'
import { AdOverlayCard } from './AdOverlayCard'
import {
  pickCenterHeroCampaign,
  resolveRenderableSlotId,
  trackAdImpression,
} from '../lib/adCampaigns'
import { displaySlotIdsForPage, pageKeyFromSideAdsPage } from '../lib/adPlacementSlots'
import type { SideAdsPage } from './PageWithSideAds'
import { MobileAdBanner } from './MobileAdBanner'

type CenterPageAdProps = {
  page: SideAdsPage
  className?: string
}

/** Центральний банер («По центру») на desktop/tablet. На телефоні — мобільні блоки. */
export function CenterPageAd({ page, className = '' }: CenterPageAdProps) {
  const { loading, getForSlots } = usePaidAds()
  const pageKey = pageKeyFromSideAdsPage(page)

  const slotIds = useMemo(() => displaySlotIdsForPage(pageKey, 1), [pageKey])
  const pool = useMemo(() => getForSlots(slotIds, 16), [getForSlots, slotIds])

  const campaign = useMemo(
    () => pickCenterHeroCampaign(pool, pageKey),
    [pool, pageKey],
  )

  const slotId = campaign ? resolveRenderableSlotId(campaign, slotIds) : null

  useEffect(() => {
    if (loading || !campaign) return
    void trackAdImpression(campaign.id)
  }, [loading, campaign])

  if (loading || !campaign || !slotId) return null

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

/**
 * Внутрішні сторінки: «По центру» на десктопі + мобільний блок на телефоні.
 * На головній обидва лишаються окремо (SponsoredCompanies + MobileAdBanner).
 */
export function PageContentAds({
  page,
  outerClassName = 'mb-4',
}: {
  page: SideAdsPage
  outerClassName?: string
}) {
  return (
    <div className={outerClassName}>
      <CenterPageAd page={page} className="mb-4" />
      <MobileAdBanner variant="horizontal" page={page} outerClassName="md:hidden" />
    </div>
  )
}
