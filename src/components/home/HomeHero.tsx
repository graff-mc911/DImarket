import type { FormEvent } from 'react'
import { Bot, Search } from 'lucide-react'
import { useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import type { HomeMetrics } from '../../lib/homeMarketplace'
import { navigateTo } from '../../lib/navigation'
import { AnimatedStat } from './AnimatedStat'

interface HomeHeroProps {
  metrics: HomeMetrics
}

export function HomeHero({ metrics }: HomeHeroProps) {
  const { t } = useApp()
  const [query, setQuery] = useState('')

  const onSearch = (e: FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    navigateTo(q ? `/professionals?q=${encodeURIComponent(q)}` : '/professionals')
  }

  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero__bg" aria-hidden />
      <div className="home-hero__content layout-page-gutter">
        <p className="home-hero__eyebrow">{t('homePremium.eyebrow')}</p>
        <h1 id="home-hero-title" className="home-hero__title">
          {t('homePremium.heroTitle')}
        </h1>
        <p className="home-hero__subtitle">{t('homePremium.heroSubtitle')}</p>

        <form className="home-hero__search" onSubmit={onSearch} role="search">
          <Search className="home-hero__search-icon" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('homePremium.searchPlaceholder')}
            aria-label={t('homePremium.searchPlaceholder')}
          />
          <button type="submit" className="home-hero__search-btn">
            {t('homePremium.search')}
          </button>
        </form>

        <div className="home-hero__actions">
          <button
            type="button"
            className="home-btn home-btn--primary"
            onClick={() => navigateTo('/create-project')}
          >
            {t('homePremium.postProject')}
          </button>
          <button
            type="button"
            className="home-btn home-btn--ghost"
            onClick={() => navigateTo('/assistant')}
          >
            <Bot className="h-4 w-4" aria-hidden />
            {t('homePremium.aiAssistant')}
          </button>
        </div>

        <div className="home-hero__stats" aria-label={t('homePremium.statsLabel')}>
          <AnimatedStat value={metrics.professionals} label={t('homePremium.statPros')} />
          <AnimatedStat value={metrics.reviews} label={t('homePremium.statReviews')} />
          <AnimatedStat value={metrics.countries} label={t('homePremium.statCountries')} />
          <AnimatedStat value={metrics.projects} label={t('homePremium.statProjects')} />
        </div>
      </div>
    </section>
  )
}
