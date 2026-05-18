import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, Globe2, MapPin, Megaphone, X } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { supabase } from '../lib/supabase'
import { AdCampaign } from '../lib/types'

interface AdBannerProps {
  position: 'left' | 'right'
  sticky?: boolean
}

export function AdBanner({ position, sticky = true }: AdBannerProps) {
  const { t } = useApp()

  // Даємо користувачу можливість локально сховати рекламний блок.
  const [adVisible, setAdVisible] = useState(true)

  // Тут зберігаємо активні рекламні кампанії, які вже пройшли модерацію.
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([])

  // Loading потрібен, щоб акуратно показати стан завантаження замість порожнього блоку.
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // На десктопі підтягуємо активну рекламу із Supabase.
    void loadSidebarCampaigns()
  }, [])

  const loadSidebarCampaigns = async () => {
    setLoading(true)

    try {
      const now = Date.now()

      // На цьому етапі показуємо лише sidebar-кампанії.
      // Географія вже збережена в базі, а автоматичний гео-відбір можна підключити наступним кроком.
      const { data, error } = await supabase
        .from('ad_campaigns')
        .select('*')
        .eq('placement', 'sidebar')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(6)

      if (error) {
        throw error
      }

      const activeCampaigns = ((data as AdCampaign[] | null) || []).filter((campaign) => {
        const startsAt = campaign.starts_at ? new Date(campaign.starts_at).getTime() : null
        const endsAt = campaign.ends_at ? new Date(campaign.ends_at).getTime() : null

        const started = startsAt === null || startsAt <= now
        const notEnded = endsAt === null || endsAt >= now

        return started && notEnded
      })

      setCampaigns(activeCampaigns)
    } catch (error) {
      console.error('Помилка завантаження рекламних кампаній:', error)
      setCampaigns([])
    } finally {
      setLoading(false)
    }
  }

  const [primaryCampaign, secondaryCampaign] = useMemo(() => {
    // Щоб лівий і правий банери не дублювали один і той самий запис,
    // пробуємо віддати різні кампанії залежно від позиції.
    if (campaigns.length === 0) {
      return [null, null] as const
    }

    if (position === 'left') {
      return [campaigns[0] || null, campaigns[1] || null] as const
    }

    return [campaigns[1] || campaigns[0] || null, campaigns[2] || campaigns[0] || null] as const
  }, [campaigns, position])

  if (!adVisible) {
    return null
  }

  return (
    <aside
      className={`hidden h-fit w-full lg:block ${sticky ? 'sticky top-20' : ''}`}
      style={{ maxHeight: sticky ? 'calc(100vh - 6rem)' : undefined }}
    >
      {/* Верхній блок показує головну активну рекламну кампанію або заглушку. */}
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
          <CampaignCard
            campaign={primaryCampaign}
            compact={false}
          />
        ) : (
          <AdPlaceholder
            title={t('ads.adSpace')}
            text={t('ads.advertiseHere')}
            sizeLabel="300 x 250"
          />
        )}
      </div>

      {/* Нижній блок використовує другу кампанію, якщо вона є.
          Якщо її немає, показуємо спокійну рекламну заглушку. */}
      {sticky && (
        <div className="glass-card mt-4 border border-[rgba(148,163,184,0.18)] p-4">
          {loading ? (
            <div className="h-24 animate-pulse rounded-[20px] bg-[rgba(148,163,184,0.12)]" />
          ) : secondaryCampaign ? (
            <CampaignCard
              campaign={secondaryCampaign}
              compact={true}
            />
          ) : (
            <AdPlaceholder
              title={t('ads.stickyAdBlock')}
              text={t('ads.premiumPlacement')}
              sizeLabel="300 x 80"
              compact={true}
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
  campaign: AdCampaign
  compact: boolean
}) {
  const geoLabel = getGeoTargetLabel(campaign)
  const imageHeightClass = compact ? 'h-24' : 'h-48'

  return (
    // Реальна картка рекламної кампанії з переходом на сайт рекламодавця.
    <a
      href={campaign.link_url}
      target="_blank"
      rel="noreferrer"
      className="block"
    >
      <div className="space-y-4">
        <div className="rounded-[24px] bg-white/70 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#64748b]">
            <Megaphone className="h-3.5 w-3.5" />
            <span>Реклама</span>
          </div>

          <div
            className={`mt-3 overflow-hidden rounded-[20px] border border-[rgba(148,163,184,0.14)] bg-[rgba(248,250,252,0.68)] ${imageHeightClass}`}
          >
            <img
              src={campaign.image_url}
              alt={campaign.title}
              className="h-full w-full object-cover"
            />
          </div>

          <h3 className={`mt-4 font-extrabold text-[#2f2a24] ${compact ? 'text-base' : 'text-lg'}`}>
            {campaign.title}
          </h3>

          {campaign.description && !compact && (
            <p className="mt-2 text-sm leading-6 text-[#6f665d]">
              {campaign.description}
            </p>
          )}

          <div className="mt-3 flex items-center gap-2 text-xs text-[#7a7168]">
            {campaign.geo_scope === 'global' ? (
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
              <span>Перейти</span>
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
}: {
  title: string
  text: string
  sizeLabel: string
  compact?: boolean
}) {
  const blockHeightClass = compact ? 'h-24' : 'h-48'

  return (
    // Заглушка показується, якщо ще немає активної реклами.
    <div className="space-y-4 text-center">
      <div className="rounded-[24px] bg-white/70 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
        <div
          className={`mb-4 flex w-full items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,rgba(148,163,184,0.22),rgba(100,116,139,0.26))] text-base font-bold text-[#475569] ${blockHeightClass}`}
        >
          {title}
        </div>

        <p className="text-sm font-semibold text-[#2f2a24]">{text}</p>
        <p className="mt-2 text-xs text-[#7a7168]">{sizeLabel}</p>
      </div>
    </div>
  )
}

function AdLoadingState() {
  return (
    // Скелетон під час завантаження реклами із бази.
    <div className="space-y-4">
      <div className="rounded-[24px] bg-white/70 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
        <div className="h-4 w-24 animate-pulse rounded bg-[rgba(148,163,184,0.16)]" />
        <div className="mt-4 h-48 animate-pulse rounded-[20px] bg-[rgba(148,163,184,0.14)]" />
        <div className="mt-4 h-5 w-3/4 animate-pulse rounded bg-[rgba(148,163,184,0.16)]" />
        <div className="mt-3 h-4 w-full animate-pulse rounded bg-[rgba(148,163,184,0.12)]" />
        <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-[rgba(148,163,184,0.12)]" />
      </div>
    </div>
  )
}

function getPlacementLabel(placement: AdCampaign['placement']) {
  const labels: Record<AdCampaign['placement'], string> = {
    home: 'Головна',
    listings: 'Оголошення',
    sidebar: 'Боковий блок',
    footer: 'Нижній блок',
    mobile_sticky: 'Мобільний блок',
  }

  return labels[placement]
}

function getGeoTargetLabel(campaign: AdCampaign) {
  // Перетворюємо структуру гео-полів у короткий і зрозумілий підпис для банера.
  if (campaign.geo_scope === 'global') {
    return 'Весь світ'
  }

  if (campaign.geo_scope === 'country') {
    return campaign.country_name || 'Одна країна'
  }

  if (campaign.geo_scope === 'region') {
    return `${campaign.region_name || 'Регіон'} / ${campaign.country_name || 'Країна'}`
  }

  return `${campaign.city_name || 'Місто'} / ${campaign.country_name || 'Країна'}`
}
