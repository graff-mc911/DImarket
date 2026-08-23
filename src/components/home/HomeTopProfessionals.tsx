import { Globe, Languages, MapPin, Phone, ShieldCheck, Star } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import type { HomeProfessional } from '../../lib/homeMarketplace'
import { formatProfessionalCardTitle } from '../../lib/professionalDisplay'
import { resolveDirectoryAvatarUrl } from '../../lib/directoryAvatars'
import { navigateTo } from '../../lib/navigation'

function normalizeWebsiteHref(raw: string | null | undefined): string | null {
  const value = (raw ?? '').trim()
  if (!value) return null
  if (/^https?:\/\//i.test(value)) return value
  return `https://${value}`
}

function websiteDisplayLabel(href: string): string {
  return href.replace(/^https?:\/\//i, '').replace(/\/$/, '')
}

interface HomeTopProfessionalsProps {
  professionals: HomeProfessional[]
  loading?: boolean
}

export function HomeTopProfessionals({ professionals, loading }: HomeTopProfessionalsProps) {
  const { t } = useApp()

  return (
    <section className="home-section layout-page-gutter" aria-labelledby="home-pros-title">
      <div className="home-section__head home-section__head--center">
        <div>
          <p className="home-section__eyebrow">{t('homePremium.prosEyebrow')}</p>
          <h2 id="home-pros-title" className="home-section__title home-section__title--sm">
            {t('homePremium.prosTitle')}
          </h2>
          <p className="home-section__subtitle">{t('homePremium.prosSubtitle')}</p>
          <button
            type="button"
            className="home-section__link"
            onClick={() => navigateTo('/professionals')}
          >
            {t('homePremium.seeAllPros')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="home-rail home-rail--pros home-rail--grid4" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="home-pro-card home-pro-card--skeleton" />
          ))}
        </div>
      ) : professionals.length === 0 ? (
        <p className="home-section__empty">{t('home.noProfessionals')}</p>
      ) : (
        <div className="home-rail home-rail--pros home-rail--grid4" role="list">
          {professionals.map((pro) => {
            const name = formatProfessionalCardTitle(pro, t('professional.defaultName'))
            const avatar = resolveDirectoryAvatarUrl(pro.id, pro.profile_photo, pro.avatar_url)
            const langs = (pro.languages ?? []).slice(0, 3)
            const location = (pro.location || '').trim()
            const responseTime = t('homePremium.responseTypical')
            const phone = (pro.phone ?? '').trim()
            const websiteHref = normalizeWebsiteHref(pro.website)
            const websiteLabel = websiteHref ? websiteDisplayLabel(websiteHref) : ''

            return (
              <article key={pro.id} className="home-pro-card" role="listitem">
                <button
                  type="button"
                  className="home-pro-card__hit"
                  onClick={() => navigateTo(`/professional/${pro.id}`)}
                >
                  <div className="home-pro-card__avatar">
                    {avatar ? (
                      <img src={avatar} alt="" loading="lazy" />
                    ) : (
                      <span>{name.slice(0, 1).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="home-pro-card__info">
                    <div className="home-pro-card__name-row">
                      <h3>{name}</h3>
                      {pro.is_verified ? (
                        <span className="home-pro-card__verified">
                          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                          {t('homePremium.verified')}
                        </span>
                      ) : null}
                    </div>
                    <p className="home-pro-card__rating">
                      <Star className="h-4 w-4 fill-[#ff9900] text-[#ff9900]" aria-hidden />
                      {(pro.rating ?? 0) > 0 ? Number(pro.rating).toFixed(1) : t('professional.new')}
                      <span>
                        · {pro.completed_jobs ?? 0} {t('homePremium.completedProjects')}
                      </span>
                    </p>
                    {location ? (
                      <p className="home-pro-card__langs">
                        <MapPin className="h-3.5 w-3.5" aria-hidden />
                        {location}
                      </p>
                    ) : null}
                    {langs.length > 0 ? (
                      <p className="home-pro-card__langs">
                        <Languages className="h-3.5 w-3.5" aria-hidden />
                        {langs.join(', ')}
                      </p>
                    ) : null}
                    <p className="home-pro-card__response">
                      {t('homePremium.responseTime')}: {responseTime}
                    </p>
                  </div>
                </button>
                {(phone || websiteHref) && (
                  <div className="home-pro-card__contacts">
                    {phone ? (
                      <a href={`tel:${phone.replace(/\s+/g, '')}`}>
                        <Phone className="h-3.5 w-3.5" aria-hidden />
                        {phone}
                      </a>
                    ) : null}
                    {websiteHref ? (
                      <a href={websiteHref} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-3.5 w-3.5" aria-hidden />
                        {websiteLabel}
                      </a>
                    ) : null}
                  </div>
                )}
                <button
                  type="button"
                  className="home-btn home-btn--primary home-btn--sm"
                  onClick={() => navigateTo(`/professional/${pro.id}`)}
                >
                  {t('homePremium.viewProfile')}
                </button>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
