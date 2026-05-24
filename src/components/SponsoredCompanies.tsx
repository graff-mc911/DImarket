import { useEffect, useMemo } from 'react'
import { useApp } from '../contexts/AppContext'
import { usePaidAds } from '../contexts/PaidAdsContext'
import { AdOverlayCard } from './AdOverlayCard'
import { pickCenterHeroCampaign, trackAdImpression } from '../lib/adCampaigns'
import { navigateTo } from '../lib/navigation'

export function SponsoredCompanies() {
  const { t } = useApp()
  const { loading, getForSlots } = usePaidAds()
  const pool = getForSlots(['home_center'], 16)
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
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold tracking-[-0.02em] text-[var(--ink-900)] md:text-2xl">
              {t('home.sponsoredTitle')}
            </h2>
            <p className="muted-text mt-2 max-w-2xl text-sm">
              {t('home.sponsoredSubtitle')}
            </p>
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
            variant="center"
            className="w-full max-w-xl"
            showDescription
          />
        </div>
      </div>
    </section>
  )
}
