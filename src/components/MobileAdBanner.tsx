import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { usePaidAds } from '../contexts/PaidAdsContext'
import { AdOverlayCard } from './AdOverlayCard'
import { mobileInlineSlotId, pageKeyFromMobilePage, type InlineIndex } from '../lib/adPlacementSlots'
import { adSlotTailwind } from '../lib/adSlotLayout'
import { pickMobileCampaign, trackAdImpression } from '../lib/adCampaigns'

interface MobileAdBannerProps {
  variant: 'inline' | 'horizontal'
  page?: 'home' | 'listings' | 'professionals' | 'default'
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
  const slotId = useMemo(
    () =>
      variant === 'horizontal'
        ? mobileInlineSlotId(pageKey, 1)
        : mobileInlineSlotId(pageKey, inlineIndex),
    [pageKey, variant, inlineIndex],
  )

  const mobileCampaigns = useMemo(
    () => getForSlots([slotId], 16),
    [getForSlots, slotId],
  )

  const campaign = useMemo(
    () => pickMobileCampaign(mobileCampaigns, variant, pageKey, inlineIndex),
    [mobileCampaigns, variant, pageKey, inlineIndex],
  )

  const isHorizontal = variant === 'horizontal'

  useEffect(() => {
    if (loading || !campaign) return
    void trackAdImpression(campaign.id)
  }, [loading, campaign])

  if (!adVisible || loading || !campaign) return null

  const showOnDesktop = variant === 'horizontal'

  const block = (
    <div className={showOnDesktop ? 'my-4' : 'ad-slot-mobile-inline'}>
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
          slotId={slotId}
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
