import { ArrowRight, Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import { useApp } from '../../contexts/AppContext'
import {
  marketplaceCategoryLabel,
  type MarketplaceCategory,
} from '../../lib/marketplaceCategories'
import { navigateTo } from '../../lib/navigation'

interface CategoryAiRecommendationProps {
  categoryTitle: string
  services: MarketplaceCategory[]
}

export function CategoryAiRecommendation({
  categoryTitle,
  services,
}: CategoryAiRecommendationProps) {
  const { language, t } = useApp()

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

  return (
    <section className="cat-section" aria-labelledby="cat-ai">
      <div className="cat-section__head">
        <h2 id="cat-ai" className="cat-section__title-row">
          <Sparkles className="h-5 w-5 text-[#ff9900]" aria-hidden />
          {t('catPage.aiRecommendation')}
        </h2>
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
