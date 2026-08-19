import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { usePaidAds } from '../contexts/PaidAdsContext'
import { AdOverlayCard } from './AdOverlayCard'
import { displayMobileSlotIdsForPage, pageKeyFromMobilePage, type AdPageKey, type InlineIndex } from '../lib/adPlacementSlots'
import { adSlotTailwind } from '../lib/adSlotLayout'
import { pickMobileCampaign, resolveRenderableSlotId, trackAdImpression } from '../lib/adCampaigns'

interface MobileAdBannerProps {
  variant: 'inline' | 'horizontal'
  page?: AdPageKey
  /** Слот 1–4 між картками / секціями (лише inline) */
  inlineIndex?: InlineIndex
  /** Обгортка лише коли є реклама (без порожніх відступів у сітці) */
  outerClassName?: string
}

export function MobileAdBanner({
  variant,
  page,
  inlineIndex = 1,
  outerClassName,
}: MobileAdBannerProps) {
  const { t } = useApp()
  const { loading, getForSlots } = usePaidAds()
  const [adVisible, setAdVisible] = useState(true)

  const pageKey = pageKeyFromMobilePage(page)

  const lookupSlots = useMemo(
    () => displayMobileSlotIdsForPage(pageKey, variant === 'horizontal' ? 1 : inlineIndex),
    [pageKey, variant, inlineIndex],
  )

  const mobileCampaigns = useMemo(
    () => getForSlots(lookupSlots, 16),
    [getForSlots, lookupSlots],
  )

  const campaign = useMemo(
    () => pickMobileCampaign(mobileCampaigns, variant, pageKey, inlineIndex),
    [mobileCampaigns, variant, pageKey, inlineIndex],
  )

  const renderSlotId = campaign ? resolveRenderableSlotId(campaign, lookupSlots) : null

  const isHorizontal = variant === 'horizontal'

  useEffect(() => {
    if (loading || !campaign) return
    void trackAdImpression(campaign.id)
  }, [loading, campaign])

  if (!adVisible || loading || !campaign || !renderSlotId) return null

  const showOnDesktop = variant === 'horizontal'

  const block = (
    <div className={showOnDesktop ? 'my-4 w-full min-w-0 max-w-full' : 'ad-slot-mobile-inline'}>
      <div className="relative">
        <button
          onClick={() => setAdVisible(false)}
          type="button"
          className="absolute right-2 top-2 z-10 rounded-full bg-black/40 p-1 text-white/90 backdrop-blur-sm transition hover:bg-black/55"
          aria-label={t('ads.close')}
        >
          <X className="h-3.5 w-3.5" />
        </button>

          <AdOverlayCard
          campaign={campaign}
          slotId={renderSlotId}
          variant={isHorizontal ? 'leaderboard' : 'mobile-inline'}
          className={isHorizontal ? adSlotTailwind.leaderboard : adSlotTailwind.mobileInline}
          showGeo={!isHorizontal}
          imageOnly={isHorizontal}
        />
      </div>
    </div>
  )

  const wrapClass = outerClassName ?? 'w-full min-w-0'

  return <div className={wrapClass}>{block}</div>
}
