import { useEffect, useMemo } from 'react'
import { useApp } from '../contexts/AppContext'
import { usePaidAds } from '../contexts/PaidAdsContext'
import { AdOverlayCard } from './AdOverlayCard'
import { pickCenterHeroCampaign, trackAdImpression } from '../lib/adCampaigns'
import { navigateTo } from '../lib/navigation'

export function SponsoredCompanies() {
  const { t } = useApp()
  const { loading, getForSlots } = usePaidAds()
  const pool = getForSlots(['home_center', 'home_mob_inline_1', 'footer', 'home'], 16)
  const campaign = useMemo(() => pickCenterHeroCampaign(pool, 'home'), [pool])

  useEffect(() => {
    if (loading || !campaign) return
    void trackAdImpression(campaign.id)
  }, [loading, campaign])

  if (loading || !campaign) {
    return null
  }

  return (
    <section className="py-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold tracking-[-0.02em] text-[var(--ink-900)] md:text-2xl">
              {t('home.sponsoredTitle')}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('/advertising')}
            className="text-sm font-semibold text-[var(--accent-700)] transition hover:underline"
          >
            {t('home.sponsoredCta')}
          </button>
        </div>

        <div className="flex justify-center">
          <AdOverlayCard
            campaign={campaign}
            slotId="home_center"
            variant="center"
            className="w-full"
            showDescription
          />
        </div>
    </section>
  )
}
