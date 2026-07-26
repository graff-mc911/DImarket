import { ArrowRight, MapPin, ShieldCheck, Sparkles, Star } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import {
  marketplaceCategoryLabel,
  type MarketplaceCategory,
} from '../../lib/marketplaceCategories'
import { navigateTo } from '../../lib/navigation'
import { getRecentCategories, type RecentCategoryView } from '../../lib/recentCategories'
import { formatProfessionalCardTitle } from '../../lib/professionalDisplay'
import type { Profile } from '../../lib/types'

interface CategoryAiRecommendationProps {
  categoryTitle: string
  services: MarketplaceCategory[]
  professionals: Profile[]
}

export function CategoryAiRecommendation({
  categoryTitle,
  services,
  professionals,
}: CategoryAiRecommendationProps) {
  const { language, profile, t } = useApp()
  const [recentServices, setRecentServices] = useState<RecentCategoryView[]>([])

  useEffect(() => {
    setRecentServices(getRecentCategories().slice(0, 3))
  }, [])

  const tips = useMemo(() => {
    const top = services[0]
    return [
      t('marketplace.aiTipPros').replace('{category}', categoryTitle),
      top
        ? t('marketplace.aiTipService').replace(
            '{service}',
            marketplaceCategoryLabel(top, language.code),
          )
        : t('marketplace.aiTipPost'),
      t('marketplace.aiTipEstimate'),
    ]
  }, [categoryTitle, services, language.code, t])

  const recommendedPros = useMemo(() => {
    const location = (profile?.location ?? '').toLowerCase()
    const recentSlugs = new Set(recentServices.map((item) => item.slug))

    return [...professionals]
      .sort((a, b) => {
        const aLocation = location && (a.location ?? '').toLowerCase().includes(location) ? 1 : 0
        const bLocation = location && (b.location ?? '').toLowerCase().includes(location) ? 1 : 0
        if (bLocation !== aLocation) return bLocation - aLocation

        const aRecent = (a.work_subcategory_slugs ?? []).some((slug) => recentSlugs.has(slug)) ? 1 : 0
        const bRecent = (b.work_subcategory_slugs ?? []).some((slug) => recentSlugs.has(slug)) ? 1 : 0
        if (bRecent !== aRecent) return bRecent - aRecent

        const verifiedDelta = Number(Boolean(b.is_verified)) - Number(Boolean(a.is_verified))
        if (verifiedDelta !== 0) return verifiedDelta
        return Number(b.rating ?? 0) - Number(a.rating ?? 0)
      })
      .slice(0, 3)
  }, [professionals, profile?.location, recentServices])

  const signalText =
    recentServices.length > 0
      ? recentServices.map((item) => item.name).join(', ')
      : services[0]
        ? marketplaceCategoryLabel(services[0], language.code)
        : categoryTitle

  return (
    <section className="cat-section" aria-labelledby="cat-ai">
      <div className="cat-section__head">
        <h2 id="cat-ai" className="cat-section__title-row">
          <Sparkles className="h-5 w-5 text-[#ff9900]" aria-hidden />
          {t('catPage.aiRecommendation')}
        </h2>
      </div>
      <div className="cat-ai-recommendation">
        <div className="cat-ai-recommendation__intro">
          <p>
            {t('catPage.aiRecommendationText')
              .replace('{location}', profile?.location || t('catPage.yourArea'))
              .replace('{signals}', signalText)}
          </p>
          <button
            type="button"
            className="cat-ai-card__cta cat-ai-card__cta--solid"
            onClick={() => navigateTo('/assistant')}
          >
            {t('marketplace.openAssistant')}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {recommendedPros.length > 0 ? (
          <div className="cat-ai-pros">
            {recommendedPros.map((pro) => {
              const name = formatProfessionalCardTitle(pro, t('professional.defaultName'))
              return (
                <button
                  key={pro.id}
                  type="button"
                  className="cat-ai-pro"
                  onClick={() => navigateTo(`/professional/${pro.id}`)}
                >
                  <span className="cat-ai-pro__avatar">
                    {pro.profile_photo || pro.avatar_url ? (
                      <img src={pro.profile_photo || pro.avatar_url || ''} alt="" loading="lazy" />
                    ) : (
                      name.slice(0, 1).toUpperCase()
                    )}
                  </span>
                  <span className="cat-ai-pro__body">
                    <strong>{name}</strong>
                    <span>
                      <Star className="h-3.5 w-3.5 fill-[#ff9900] text-[#ff9900]" aria-hidden />
                      {Number(pro.rating ?? 0) > 0 ? Number(pro.rating).toFixed(1) : t('professional.new')}
                      {pro.is_verified ? (
                        <>
                          {' · '}
                          <ShieldCheck className="h-3.5 w-3.5 text-[#067d62]" aria-hidden />
                          {t('professional.verified')}
                        </>
                      ) : null}
                    </span>
                    <span>
                      <MapPin className="h-3.5 w-3.5" aria-hidden />
                      {pro.location || t('professional.global')}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        ) : null}
      </div>

      <div className="cat-ai-grid">
        {tips.map((tip) => (
          <article key={tip} className="cat-ai-card">
            <p>{tip}</p>
            <button
              type="button"
              className="cat-ai-card__cta"
              onClick={() => navigateTo('/assistant')}
            >
              {t('marketplace.openAssistant')}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
