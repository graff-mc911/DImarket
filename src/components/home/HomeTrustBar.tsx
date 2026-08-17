import { Briefcase, Globe2, Radio, ShieldCheck, Star } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { useOnlineVisitors } from '../../hooks/useOnlineVisitors'
import type { HomeMetrics } from '../../lib/homeMarketplace'
import { AnimatedStat } from './AnimatedStat'

interface HomeTrustBarProps {
  metrics: HomeMetrics
}

export function HomeTrustBar({ metrics }: HomeTrustBarProps) {
  const { t } = useApp()
  const onlineNow = useOnlineVisitors()

  const items = [
    ...(metrics.reviews > 0
      ? [
          {
            id: 'reviews' as const,
            icon: Star,
            value: metrics.reviews,
            label: t('homePremium.trustReviews'),
            prefix: '★★★★★ ',
          },
        ]
      : []),
    {
      id: 'pros' as const,
      icon: ShieldCheck,
      value: metrics.professionals,
      label: t('homePremium.trustPros'),
    },
    {
      id: 'countries' as const,
      icon: Globe2,
      value: metrics.countries,
      label: t('homePremium.trustCountries'),
    },
    {
      id: 'projects' as const,
      icon: Briefcase,
      value: metrics.projects,
      label: t('homePremium.trustProjects'),
    },
    {
      id: 'online' as const,
      icon: Radio,
      value: onlineNow,
      label: t('homePremium.trustOnline'),
    },
  ]

  return (
    <section className="home-trust layout-page-gutter" aria-label={t('homePremium.trustLabel')}>
      <div className="home-trust__grid">
        {items.map((item, index) => {
          const Icon = item.icon
          return (
            <article
              key={item.id}
              className="home-trust__card"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <span className="home-trust__icon" aria-hidden>
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="home-trust__body">
                {'prefix' in item && item.prefix ? (
                  <p className="home-trust__stars" aria-hidden>
                    {item.prefix.trim()}
                  </p>
                ) : null}
                <AnimatedStat
                  value={item.value}
                  label={item.label}
                  className="home-trust__stat"
                />
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
