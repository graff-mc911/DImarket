import { useEffect } from 'react'
import { ExternalLink, Megaphone } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { usePaidAds } from '../contexts/PaidAdsContext'
import {
  AD_MEDIA_FALLBACK,
  getAdvertiserLabel,
  getCampaignMediaUrl,
  trackAdClick,
  trackAdImpression,
  type AdCampaignWithAdvertiser,
} from '../lib/adCampaigns'
import { navigateTo } from '../lib/navigation'

export function SponsoredCompanies() {
  const { t } = useApp()
  const { loading, getForSlots } = usePaidAds()
  const campaigns = getForSlots(['home', 'sidebar', 'listings'], 3)

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
                className="h-52 animate-pulse rounded-[24px] bg-[rgba(148,163,184,0.14)]"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {campaigns.map((campaign) => (
              <SponsorCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function SponsorCard({ campaign }: { campaign: AdCampaignWithAdvertiser }) {
  const { t } = useApp()
  const company = getAdvertiserLabel(campaign)
  const mediaUrl = getCampaignMediaUrl(campaign)

  const handleClick = () => {
    void trackAdClick(campaign.id)
  }

  return (
    <a
      href={campaign.link_url}
      target="_blank"
      rel="noreferrer sponsored"
      onClick={handleClick}
      className="glass-card group w-full overflow-hidden border border-[rgba(148,163,184,0.18)] transition duration-300 hover:-translate-y-0.5"
    >
      <div className="relative h-32 overflow-hidden bg-[rgba(248,250,252,0.68)]">
        <img
          src={mediaUrl}
          alt={campaign.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          onError={(e) => {
            e.currentTarget.src = AD_MEDIA_FALLBACK
          }}
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#64748b]">
          {t('ads.badge')}
        </span>
      </div>

      <div className="p-4">
        {company && (
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#94a3b8]">
            {company}
          </p>
        )}
        <h3 className="mt-1 line-clamp-2 text-base font-extrabold text-[#2f2a24]">
          {campaign.title}
        </h3>
        {campaign.description && (
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#6f665d]">
            {campaign.description}
          </p>
        )}
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#475569]">
          {t('ads.visit')}
          <ExternalLink className="h-3.5 w-3.5" />
        </span>
      </div>
    </a>
  )
}
