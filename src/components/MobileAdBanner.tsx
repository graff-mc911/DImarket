import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { usePaidAds } from '../contexts/PaidAdsContext'
import { AdOverlayCard, AdOverlayPlaceholder } from './AdOverlayCard'
import { mobileInlineSlotId, pageKeyFromMobilePage, type InlineIndex } from '../lib/adPlacementSlots'
import { pickMobileCampaign, trackAdImpression } from '../lib/adCampaigns'
import { navigateTo } from '../lib/navigation'

interface MobileAdBannerProps {
  variant: 'inline' | 'horizontal'
  page?: 'home' | 'listings' | 'professionals' | 'default'
  /** Слот 1–4 між картками / секціями (лише inline) */
  inlineIndex?: InlineIndex
}

export function MobileAdBanner({ variant, page, inlineIndex = 1 }: MobileAdBannerProps) {
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

  if (!adVisible) return null

  const showOnDesktop = variant === 'horizontal'

  return (
    <div className={showOnDesktop ? 'my-4' : 'my-4 xl:hidden'}>
      <div className="relative">
        <button
          onClick={() => setAdVisible(false)}
          type="button"
          className="absolute right-2 top-2 z-10 rounded-full bg-black/40 p-1 text-white/90 backdrop-blur-sm transition hover:bg-black/55"
          aria-label={t('ads.close')}
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {loading ? (
          <div
            className={
              isHorizontal
                ? 'aspect-[4/1] w-full max-h-[300px] animate-pulse bg-white/20'
                : 'min-h-[88px] animate-pulse bg-white/20'
            }
          />
        ) : campaign ? (
          <AdOverlayCard
            campaign={campaign}
            variant={isHorizontal ? 'leaderboard' : 'mobile-inline'}
            className={isHorizontal ? 'w-full' : 'min-h-[88px]'}
            showGeo={!isHorizontal}
            imageOnly={isHorizontal}
          />
        ) : (
          <AdOverlayPlaceholder
            variant={isHorizontal ? 'leaderboard' : 'mobile-inline'}
            className={isHorizontal ? 'w-full' : 'min-h-[88px]'}
            title={t('ads.adSpace')}
            subtitle={t('ads.advertiseHere')}
            onClick={() => navigateTo('/advertising')}
          />
        )}
      </div>
    </div>
  )
}
