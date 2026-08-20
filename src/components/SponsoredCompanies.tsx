import { useEffect, useMemo } from 'react'
import { useApp } from '../contexts/AppContext'
import { usePaidAds } from '../contexts/PaidAdsContext'
import { AdOverlayCard } from './AdOverlayCard'
import { DimarketProjectStoryBanner } from './DimarketProjectStoryBanner'
import { pickCenterHeroCampaign, trackAdImpression } from '../lib/adCampaigns'

export function SponsoredCompanies() {
  const { t } = useApp()
  const { loading, getForSlots } = usePaidAds()
  const pool = getForSlots(['home_center', 'home_mob_inline_1', 'footer', 'home'], 16)
  const campaign = useMemo(() => pickCenterHeroCampaign(pool, 'home'), [pool])

  useEffect(() => {
    if (loading || !campaign) return
    void trackAdImpression(campaign.id)
  }, [loading, campaign])

  if (loading) {
    return null
  }

  return (
    <section className="px-1 py-6" aria-labelledby="home-center-ad-title">
      <h2 id="home-center-ad-title" className="sr-only">
        {t('home.sponsoredTitle')}
      </h2>
      <div className="flex justify-center">
        {campaign ? (
          <AdOverlayCard
            campaign={campaign}
            slotId="home_center"
            variant="center"
            className="w-full"
            showDescription
          />
        ) : (
          <DimarketProjectStoryBanner className="w-full" />
        )}
      </div>
    </section>
  )
}
