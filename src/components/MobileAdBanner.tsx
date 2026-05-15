import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, Globe as Globe2, MapPin, Megaphone, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { AdCampaign } from '../lib/types'

interface MobileAdBannerProps {
  variant: 'inline' | 'sticky' | 'horizontal'
}

export function MobileAdBanner({ variant }: MobileAdBannerProps) {
  // Даємо користувачу можливість закрити мобільний рекламний блок локально.
  const [adVisible, setAdVisible] = useState(true)

  // Тут зберігаємо активні кампанії для мобільного показу.
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([])

  // Loading-стан потрібен, щоб уникнути різкого стрибка верстки.
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Для мобільних банерів тягнемо кампанії окремо:
    // спочатку mobile_sticky, а якщо їх немає — можна буде використати home/listings далі.
    void loadMobileCampaigns()
  }, [])

  const loadMobileCampaigns = async () => {
    setLoading(true)

    try {
      const now = Date.now()

      // На поточному етапі для мобільних блоків беремо кампанії,
      // спеціально створені під mobile_sticky.
      const { data, error } = await supabase
        .from('ad_campaigns')
        .select('*')
        .eq('placement', 'mobile_sticky')
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
      console.error('Помилка завантаження мобільної реклами:', error)
      setCampaigns([])
    } finally {
      setLoading(false)
    }
  }

  const campaign = useMemo(() => {
    // Поки що для кожного мобільного блоку беремо першу доступну активну кампанію.
    return campaigns[0] || null
  }, [campaigns])

  if (!adVisible) {
    return null
  }

  if (variant === 'sticky') {
    return (
      <div className="fixed bottom-3 left-3 right-3 z-40 lg:hidden">
        <div className="glass-card relative overflow-hidden border border-[rgba(148,163,184,0.18)] px-4 py-3 shadow-[0_18px_45px_rgba(15,23,42,0.10)]">
          <button
            onClick={() => setAdVisible(false)}
            type="button"
            className="absolute right-3 top-3 rounded-full border border-white/70 bg-white/75 p-1 text-[#7a7168] transition hover:bg-white hover:text-[#2f2a24]"
            aria-label="Закрити рекламу"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          {loading ? (
            <MobileStickyLoading />
          ) : campaign ? (
            <MobileStickyCampaignCard campaign={campaign} />
          ) : (
            <MobileStickyPlaceholder />
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
          aria-label="Закрити рекламу"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {loading ? (
          <MobileInlineLoading />
        ) : campaign ? (
          <MobileInlineCampaignCard
            campaign={campaign}
            variant={variant}
          />
        ) : (
          <MobileInlinePlaceholder variant={variant} />
        )}
      </div>
    </div>
  )
}

function MobileStickyCampaignCard({ campaign }: { campaign: AdCampaign }) {
  return (
    // Компактний sticky-формат для мобільного екрана з переходом на сайт рекламодавця.
    <a
      href={campaign.link_url}
      target="_blank"
      rel="noreferrer"
      className="block pr-8"
    >
      <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(148,163,184,0.14)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#475569]">
        <Megaphone className="h-3.5 w-3.5" />
        <span>Реклама</span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-extrabold text-[#2f2a24]">
            {campaign.title}
          </div>
          <p className="mt-1 text-xs leading-5 text-[#6f665d]">
            {getGeoTargetLabel(campaign)}
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
  campaign: AdCampaign
  variant: 'inline' | 'horizontal'
}) {
  const cardHeightClass = variant === 'horizontal' ? 'h-20' : 'h-28'

  return (
    // Повноцінна мобільна картка реклами для inline та horizontal форматів.
    <a
      href={campaign.link_url}
      target="_blank"
      rel="noreferrer"
      className="block pr-8"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-[rgba(148,163,184,0.14)] text-[#64748b]">
          <Megaphone className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <div className="text-sm font-extrabold text-[#2f2a24]">
            {campaign.title}
          </div>
          <p className="mt-1 text-xs leading-5 text-[#6f665d]">
            {getGeoTargetLabel(campaign)}
          </p>
        </div>
      </div>

      <div
        className={`mt-4 overflow-hidden rounded-[20px] border border-[rgba(148,163,184,0.14)] bg-[rgba(248,250,252,0.68)] ${cardHeightClass}`}
      >
        <img
          src={campaign.image_url}
          alt={campaign.title}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-[#7a7168]">
          {getPlacementLabel(campaign.placement)}
        </span>

        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#475569]">
          <span>Перейти</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </span>
      </div>
    </a>
  )
}

function MobileStickyPlaceholder() {
  return (
    // Заглушка sticky-реклами, якщо ще немає активної кампанії.
    <div className="pr-8">
      <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(148,163,184,0.14)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#475569]">
        <Megaphone className="h-3.5 w-3.5" />
        <span>Реклама</span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-extrabold text-[#2f2a24]">
            Мобільний рекламний блок
          </div>
          <p className="mt-1 text-xs leading-5 text-[#6f665d]">
            Тут буде активна рекламна кампанія після модерації.
          </p>
        </div>

        <div className="rounded-full bg-[rgba(148,163,184,0.14)] px-3 py-2 text-xs font-semibold text-[#475569]">
          320 x 50
        </div>
      </div>
    </div>
  )
}

function MobileInlinePlaceholder({
  variant,
}: {
  variant: 'inline' | 'horizontal'
}) {
  const cardHeightClass = variant === 'horizontal' ? 'h-20' : 'h-28'
  const sizeLabel = variant === 'horizontal' ? '320 x 60' : '320 x 100'

  return (
    // Заглушка для inline/horizontal формату, якщо в базі ще немає активної реклами.
    <div className="pr-8">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-[rgba(148,163,184,0.14)] text-[#64748b]">
          <Megaphone className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <div className="text-sm font-extrabold text-[#2f2a24]">
            Рекламне місце
          </div>
          <p className="mt-1 text-xs leading-5 text-[#6f665d]">
            Тут буде показана активна мобільна рекламна кампанія.
          </p>
        </div>
      </div>

      <div
        className={`mt-4 flex w-full items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,rgba(148,163,184,0.22),rgba(100,116,139,0.26))] text-sm font-bold text-[#475569] ${cardHeightClass}`}
      >
        Реклама
      </div>

      <div className="mt-3 text-center text-xs font-medium text-[#7a7168]">
        {sizeLabel}
      </div>
    </div>
  )
}

function MobileStickyLoading() {
  return (
    // Скелетон sticky-блоку під час завантаження мобільної реклами.
    <div className="pr-8">
      <div className="h-5 w-24 animate-pulse rounded bg-[rgba(148,163,184,0.16)]" />
      <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-[rgba(148,163,184,0.12)]" />
      <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-[rgba(148,163,184,0.12)]" />
    </div>
  )
}

function MobileInlineLoading() {
  return (
    // Скелетон для inline/horizontal мобільного банера.
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
  // Формуємо короткий підпис географії показу для мобільної реклами.
  if (campaign.geo_scope === 'global') {
    return 'Весь світ'
  }

  if (campaign.geo_scope === 'country') {
    return campaign.country_name || 'Одна країна'
  }

  if (campaign.geo_scope === 'region') {
    return `${campaign.region_name || 'Регіон'} / ${campaign.country_name || 'Країна'}`
  }

  return campaign.geo_scope === 'city'
    ? `${campaign.city_name || 'Місто'} / ${campaign.country_name || 'Країна'}`
    : 'Локальна реклама'
}
