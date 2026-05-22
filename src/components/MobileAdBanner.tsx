import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, Megaphone, X } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import {
  fetchPaidAdCampaigns,
  getCampaignMediaUrl,
  getGeoTargetLabel,
  trackAdClick,
  trackAdImpression,
  type AdCampaignWithAdvertiser,
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
  const [adVisible, setAdVisible] = useState(true)
  const [campaigns, setCampaigns] = useState<AdCampaignWithAdvertiser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void loadMobileCampaigns()
  }, [page])

  const loadMobileCampaigns = async () => {
    setLoading(true)
    try {
      const paid = await fetchPaidAdCampaigns({
        slots: mobileSlots(page),
        limit: 6,
      })
      setCampaigns(paid)
      if (paid[0]) void trackAdImpression(paid[0].id)
    } finally {
      setLoading(false)
    }
  }

  const campaign = useMemo(() => {
    const stickyFirst = campaigns.find((c) =>
      (c.placements || []).includes('mobile_sticky') || c.placement === 'mobile_sticky',
    )
    return stickyFirst || campaigns[0] || null
  }, [campaigns])

  if (!adVisible) return null

  if (variant === 'sticky') {
    return (
      <div className="fixed bottom-3 left-3 right-3 z-40 lg:hidden">
        <div className="glass-card relative overflow-hidden border border-[rgba(148,163,184,0.18)] px-4 py-3 shadow-[0_18px_45px_rgba(15,23,42,0.10)]">
          <button
            onClick={() => setAdVisible(false)}
            type="button"
            className="absolute right-3 top-3 rounded-full border border-white/70 bg-white/75 p-1 text-[#7a7168] transition hover:bg-white hover:text-[#2f2a24]"
            aria-label={t('ads.close')}
          >
            <X className="h-3.5 w-3.5" />
          </button>

          {loading ? (
            <MobileStickyLoading />
          ) : campaign ? (
            <MobileStickyCampaignCard campaign={campaign} />
          ) : (
            <MobileStickyPlaceholder onAdvertise={() => navigateTo('/advertising')} />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="lg:hidden">
      <div className="glass-card relative overflow-hidden border border-[rgba(148,163,184,0.18)] p-4 shadow-[0_16px_38px_rgba(15,23,42,0.08)]">
        <button
          onClick={() => setAdVisible(false)}
          type="button"
          className="absolute right-3 top-3 rounded-full border border-white/70 bg-white/75 p-1 text-[#7a7168] transition hover:bg-white hover:text-[#2f2a24]"
          aria-label={t('ads.close')}
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {loading ? (
          <MobileInlineLoading />
        ) : campaign ? (
          <MobileInlineCampaignCard campaign={campaign} variant={variant} />
        ) : (
          <MobileInlinePlaceholder
            variant={variant}
            onAdvertise={() => navigateTo('/advertising')}
          />
        )}
      </div>
    </div>
  )
}

function MobileStickyCampaignCard({ campaign }: { campaign: AdCampaignWithAdvertiser }) {
  const { t } = useApp()

  return (
    <a
      href={campaign.link_url}
      target="_blank"
      rel="noreferrer sponsored"
      className="block pr-8"
      onClick={() => void trackAdClick(campaign.id)}
    >
      <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(148,163,184,0.14)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#475569]">
        <Megaphone className="h-3.5 w-3.5" />
        <span>{t('ads.badge')}</span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-extrabold text-[#2f2a24]">{campaign.title}</div>
          <p className="mt-1 text-xs leading-5 text-[#6f665d]">
            {getGeoTargetLabel(campaign, t)}
          </p>
        </div>
        <div className="rounded-full bg-[rgba(148,163,184,0.14)] px-3 py-2 text-xs font-semibold text-[#475569]">
          320 x 50
        </div>
      </div>
    </a>
  )
}

function MobileInlineCampaignCard({
  campaign,
  variant,
}: {
  campaign: AdCampaignWithAdvertiser
  variant: 'inline' | 'horizontal'
}) {
  const { t } = useApp()
  const cardHeightClass = variant === 'horizontal' ? 'h-20' : 'h-28'
  const mediaUrl = getCampaignMediaUrl(campaign)

  return (
    <a
      href={campaign.link_url}
      target="_blank"
      rel="noreferrer sponsored"
      className="block pr-8"
      onClick={() => void trackAdClick(campaign.id)}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-[rgba(148,163,184,0.14)] text-[#64748b]">
          <Megaphone className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-extrabold text-[#2f2a24]">{campaign.title}</div>
          <p className="mt-1 text-xs leading-5 text-[#6f665d]">
            {getGeoTargetLabel(campaign, t)}
          </p>
        </div>
      </div>

      <div
        className={`mt-4 overflow-hidden rounded-[20px] border border-[rgba(148,163,184,0.14)] bg-[rgba(248,250,252,0.68)] ${cardHeightClass}`}
      >
        <img src={mediaUrl} alt={campaign.title} className="h-full w-full object-cover" />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-[#7a7168]">{t('ads.badge')}</span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#475569]">
          <span>{t('ads.visit')}</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </span>
      </div>
    </a>
  )
}

function MobileStickyPlaceholder({ onAdvertise }: { onAdvertise: () => void }) {
  const { t } = useApp()

  return (
    <button type="button" onClick={onAdvertise} className="block w-full pr-8 text-left">
      <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(148,163,184,0.14)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#475569]">
        <Megaphone className="h-3.5 w-3.5" />
        <span>{t('ads.badge')}</span>
      </div>
      <div className="mt-3">
        <div className="text-sm font-extrabold text-[#2f2a24]">{t('ads.adSpace')}</div>
        <p className="mt-1 text-xs leading-5 text-[#6f665d]">{t('ads.advertiseHere')}</p>
      </div>
    </button>
  )
}

function MobileInlinePlaceholder({
  variant,
  onAdvertise,
}: {
  variant: 'inline' | 'horizontal'
  onAdvertise: () => void
}) {
  const { t } = useApp()
  const cardHeightClass = variant === 'horizontal' ? 'h-20' : 'h-28'
  const sizeLabel = variant === 'horizontal' ? '320 x 60' : '320 x 100'

  return (
    <button type="button" onClick={onAdvertise} className="block w-full pr-8 text-left">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-[rgba(148,163,184,0.14)] text-[#64748b]">
          <Megaphone className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-extrabold text-[#2f2a24]">{t('ads.adSpace')}</div>
          <p className="mt-1 text-xs leading-5 text-[#6f665d]">{t('ads.advertiseHere')}</p>
        </div>
      </div>
      <div
        className={`mt-4 flex w-full items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,rgba(148,163,184,0.22),rgba(100,116,139,0.26))] text-sm font-bold text-[#475569] ${cardHeightClass}`}
      >
        {t('ads.badge')}
      </div>
      <div className="mt-3 text-center text-xs font-medium text-[#7a7168]">{sizeLabel}</div>
    </button>
  )
}

function MobileStickyLoading() {
  return (
    <div className="pr-8">
      <div className="h-5 w-24 animate-pulse rounded bg-[rgba(148,163,184,0.16)]" />
      <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-[rgba(148,163,184,0.12)]" />
    </div>
  )
}

function MobileInlineLoading() {
  return (
    <div className="pr-8">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 animate-pulse rounded-[16px] bg-[rgba(148,163,184,0.14)]" />
        <div className="min-w-0 flex-1">
          <div className="h-4 w-2/3 animate-pulse rounded bg-[rgba(148,163,184,0.16)]" />
          <div className="mt-2 h-4 w-full animate-pulse rounded bg-[rgba(148,163,184,0.12)]" />
        </div>
      </div>
      <div className="mt-4 h-24 animate-pulse rounded-[20px] bg-[rgba(148,163,184,0.14)]" />
    </div>
  )
}
