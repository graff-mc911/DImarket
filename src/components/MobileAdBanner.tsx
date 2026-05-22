import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { usePaidAds } from '../contexts/PaidAdsContext'
import { AdOverlayCard, AdOverlayPlaceholder, adOverlayGlow } from './AdOverlayCard'
import {
  pickMobileCampaign,
  trackAdImpression,
  type AdPlacement,
} from '../lib/adCampaigns'
import { navigateTo } from '../lib/navigation'

interface MobileAdBannerProps {
  variant: 'inline' | 'sticky' | 'horizontal'
  page?: 'home' | 'listings'
}

function mobileSlots(page?: 'home' | 'listings'): AdPlacement[] {
  if (page === 'home') return ['mobile_sticky', 'home', 'sidebar']
  if (page === 'listings') return ['mobile_sticky', 'listings', 'home']
  return ['mobile_sticky', 'home', 'listings', 'sidebar']
}

export function MobileAdBanner({ variant, page }: MobileAdBannerProps) {
  const { t } = useApp()
  const { loading, getForSlots } = usePaidAds()
  const [adVisible, setAdVisible] = useState(true)

  const mobileCampaigns = useMemo(
    () => getForSlots(mobileSlots(page), 8),
    [getForSlots, page],
  )

  const campaign = useMemo(
    () => pickMobileCampaign(mobileCampaigns, variant),
    [mobileCampaigns, variant],
  )

  const inlineMinH = variant === 'horizontal' ? 'min-h-[100px]' : 'min-h-[120px]'

  useEffect(() => {
    if (loading || !campaign) return
    void trackAdImpression(campaign.id)
  }, [loading, campaign])

  if (!adVisible) return null

  if (variant === 'sticky') {
    return (
      <div className="fixed bottom-3 left-3 right-3 z-40 lg:hidden">
        <div className={`relative overflow-hidden ${adOverlayGlow}`}>
          <button
            onClick={() => setAdVisible(false)}
            type="button"
            className="absolute right-2 top-2 z-10 rounded-full bg-black/40 p-1 text-white/90 backdrop-blur-sm transition hover:bg-black/55"
            aria-label={t('ads.close')}
          >
            <X className="h-3.5 w-3.5" />
          </button>

          {loading ? (
            <div className="min-h-[80px] animate-pulse bg-white/20" />
          ) : campaign ? (
            <AdOverlayCard campaign={campaign} variant="mobile-sticky" showGeo />
          ) : (
            <AdOverlayPlaceholder
              variant="mobile-sticky"
              title={t('ads.adSpace')}
              subtitle={t('ads.advertiseHere')}
              onClick={() => navigateTo('/advertising')}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="lg:hidden">
      <div className={`relative overflow-hidden ${adOverlayGlow}`}>
        <button
          onClick={() => setAdVisible(false)}
          type="button"
          className="absolute right-2 top-2 z-10 rounded-full bg-black/40 p-1 text-white/90 backdrop-blur-sm transition hover:bg-black/55"
          aria-label={t('ads.close')}
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {loading ? (
          <div className={`${inlineMinH} animate-pulse bg-white/20`} />
        ) : campaign ? (
          <AdOverlayCard
            campaign={campaign}
            variant="mobile-inline"
            className={inlineMinH}
            showGeo
          />
        ) : (
          <AdOverlayPlaceholder
            variant="mobile-inline"
            className={inlineMinH}
            title={t('ads.adSpace')}
            subtitle={t('ads.advertiseHere')}
            onClick={() => navigateTo('/advertising')}
          />
        )}
      </div>
    </div>
  )
}
