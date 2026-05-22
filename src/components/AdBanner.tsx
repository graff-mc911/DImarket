import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, Globe2, MapPin, Megaphone, X } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { usePaidAds } from '../contexts/PaidAdsContext'
import {
  AD_MEDIA_FALLBACK,
  getCampaignMediaUrl,
  getGeoTargetLabel,
  trackAdClick,
  trackAdImpression,
  type AdCampaignWithAdvertiser,
  type AdPlacement,
} from '../lib/adCampaigns'
import { navigateTo } from '../lib/navigation'

interface AdBannerProps {
  position: 'left' | 'right'
  sticky?: boolean
  page?: 'home' | 'listings'
}

function slotsForPage(page?: 'home' | 'listings'): AdPlacement[] {
  if (page === 'home') return ['home', 'sidebar', 'footer']
  if (page === 'listings') return ['listings', 'sidebar', 'home']
  return ['sidebar', 'home', 'listings', 'footer']
}

export function AdBanner({ position, sticky = true, page }: AdBannerProps) {
  const { t } = useApp()
  const { loading, getForSlots } = usePaidAds()
  const [adVisible, setAdVisible] = useState(true)

  const campaigns = useMemo(
    () => getForSlots(slotsForPage(page), 6),
    [getForSlots, page],
  )

  useEffect(() => {
    if (loading || campaigns.length === 0) return
    for (const c of campaigns.slice(0, 2)) {
      void trackAdImpression(c.id)
    }
  }, [loading, campaigns])

  const [primaryCampaign, secondaryCampaign] = useMemo(() => {
    if (campaigns.length === 0) return [null, null] as const
    if (position === 'left') {
      return [campaigns[0] || null, campaigns[1] || null] as const
    }
    return [campaigns[1] || campaigns[0] || null, campaigns[2] || campaigns[0] || null] as const
  }, [campaigns, position])

  if (!adVisible) return null

  return (
    <aside
      className={`hidden h-fit w-full xl:block ${sticky ? 'sticky top-20' : ''}`}
      style={{ maxHeight: sticky ? 'calc(100vh - 6rem)' : undefined }}
    >
      <div className="glass-card relative overflow-hidden border border-[rgba(148,163,184,0.18)] p-5">
        <button
          onClick={() => setAdVisible(false)}
          type="button"
          className="absolute right-3 top-3 rounded-full border border-white/70 bg-white/75 p-1 text-[#7a7168] transition hover:bg-white hover:text-[#2f2a24]"
          aria-label={t('ads.close')}
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {loading ? (
          <AdLoadingState />
        ) : primaryCampaign ? (
          <CampaignCard campaign={primaryCampaign} compact={false} />
        ) : (
          <AdPlaceholder
            title={t('ads.adSpace')}
            text={t('ads.advertiseHere')}
            sizeLabel="300 x 250"
            onAdvertise={() => navigateTo('/advertising')}
          />
        )}
      </div>

      {sticky && (
        <div className="glass-card mt-4 border border-[rgba(148,163,184,0.18)] p-4">
          {loading ? (
            <div className="h-24 animate-pulse rounded-[20px] bg-[rgba(148,163,184,0.12)]" />
          ) : secondaryCampaign ? (
            <CampaignCard campaign={secondaryCampaign} compact={true} />
          ) : (
            <AdPlaceholder
              title={t('ads.stickyAdBlock')}
              text={t('ads.premiumPlacement')}
              sizeLabel="300 x 80"
              compact={true}
              onAdvertise={() => navigateTo('/advertising')}
            />
          )}
        </div>
      )}
    </aside>
  )
}

function CampaignCard({
  campaign,
  compact,
}: {
  campaign: AdCampaignWithAdvertiser
  compact: boolean
}) {
  const { t } = useApp()
  const geoLabel = getGeoTargetLabel(campaign, t)
  const imageHeightClass = compact ? 'h-24' : 'h-48'
  const mediaUrl = getCampaignMediaUrl(campaign)

  return (
    <a
      href={campaign.link_url}
      target="_blank"
      rel="noreferrer sponsored"
      className="block"
      onClick={() => void trackAdClick(campaign.id)}
    >
      <div className="space-y-4">
        <div className="rounded-[24px] bg-white/70 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#64748b]">
            <Megaphone className="h-3.5 w-3.5" />
            <span>{t('ads.badge')}</span>
          </div>

          <div
            className={`mt-3 overflow-hidden rounded-[20px] border border-[rgba(148,163,184,0.14)] bg-[rgba(248,250,252,0.68)] ${imageHeightClass}`}
          >
            <img
              src={mediaUrl}
              alt={campaign.title}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.src = AD_MEDIA_FALLBACK
              }}
            />
          </div>

          <h3 className={`mt-4 font-extrabold text-[#2f2a24] ${compact ? 'text-base' : 'text-lg'}`}>
            {campaign.title}
          </h3>

          {!compact && campaign.description && (
            <p className="mt-2 text-sm leading-6 text-[#6f665d]">{campaign.description}</p>
          )}

          <div className="mt-3 flex items-center gap-2 text-xs text-[#7a7168]">
            {campaign.geo_scope === 'global' || campaign.geo_scope === 'countries' ? (
              <Globe2 className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <MapPin className="h-3.5 w-3.5 shrink-0" />
            )}
            <span>{geoLabel}</span>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[rgba(148,163,184,0.14)] pt-3">
            <span className="text-xs font-medium text-[#7a7168]">
              {getPlacementLabel(campaign.placement)}
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#475569]">
              <span>{t('ads.visit')}</span>
              <ExternalLink className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </a>
  )
}

function AdPlaceholder({
  title,
  text,
  sizeLabel,
  compact = false,
  onAdvertise,
}: {
  title: string
  text: string
  sizeLabel: string
  compact?: boolean
  onAdvertise: () => void
}) {
  const blockHeightClass = compact ? 'h-24' : 'h-48'

  return (
    <div className="space-y-4 text-center">
      <div className="rounded-[24px] bg-white/70 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
        <button
          type="button"
          onClick={onAdvertise}
          className={`mb-4 flex w-full flex-col items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,rgba(148,163,184,0.22),rgba(100,116,139,0.26))] text-base font-bold text-[#475569] transition hover:opacity-90 ${blockHeightClass}`}
        >
          {title}
        </button>
        <p className="text-sm font-semibold text-[#2f2a24]">{text}</p>
        <p className="mt-2 text-xs text-[#7a7168]">{sizeLabel}</p>
      </div>
    </div>
  )
}

function AdLoadingState() {
  return (
    <div className="space-y-4">
      <div className="rounded-[24px] bg-white/70 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
        <div className="h-4 w-24 animate-pulse rounded bg-[rgba(148,163,184,0.16)]" />
        <div className="mt-4 h-48 animate-pulse rounded-[20px] bg-[rgba(148,163,184,0.14)]" />
        <div className="mt-4 h-5 w-3/4 animate-pulse rounded bg-[rgba(148,163,184,0.16)]" />
        <div className="mt-3 h-4 w-full animate-pulse rounded bg-[rgba(148,163,184,0.12)]" />
      </div>
    </div>
  )
}

function getPlacementLabel(placement: AdCampaignWithAdvertiser['placement']) {
  const labels: Record<AdCampaignWithAdvertiser['placement'], string> = {
    home: 'Головна',
    listings: 'Оголошення',
    sidebar: 'Боковий блок',
    footer: 'Нижній блок',
    mobile_sticky: 'Мобільний блок',
  }
  return labels[placement]
}
