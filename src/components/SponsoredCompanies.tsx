import { useEffect } from 'react'
import { Megaphone } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { usePaidAds } from '../contexts/PaidAdsContext'
import { AdOverlayCard, adOverlayGlow } from './AdOverlayCard'
import { pickCenterAnimatedCampaigns, trackAdImpression } from '../lib/adCampaigns'
import { navigateTo } from '../lib/navigation'

export function SponsoredCompanies() {
  const { t } = useApp()
  const { loading, getForSlots } = usePaidAds()
  const pool = getForSlots(['home', 'sidebar', 'listings', 'footer'], 16)
  const campaigns = pickCenterAnimatedCampaigns(pool, 3)

  useEffect(() => {
    if (loading || campaigns.length === 0) return
    for (const c of campaigns) {
      void trackAdImpression(c.id)
    }
  }, [loading, campaigns])

  if (!loading && campaigns.length === 0) {
    return null
  }

  return (
    <section className="py-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="eyebrow">
              <Megaphone className="h-4 w-4" />
              <span>{t('ads.badge')}</span>
            </div>
            <h2 className="mt-2 text-xl font-extrabold tracking-[-0.02em] text-[var(--ink-900)] md:text-2xl">
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

        {loading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`mx-auto min-h-[198px] w-[90%] animate-pulse bg-[rgba(148,163,184,0.14)] md:min-h-[216px] ${adOverlayGlow}`}
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {campaigns.map((campaign) => (
              <AdOverlayCard
                key={campaign.id}
                campaign={campaign}
                variant="center"
                showDescription
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
