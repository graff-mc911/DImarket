import { Building2, ChevronLeft, ChevronRight, Globe, Languages, MapPin, Phone, ShieldCheck, Star } from 'lucide-react'
import { useRef } from 'react'
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

interface HomeTopCompaniesProps {
  companies: HomeProfessional[]
  loading?: boolean
}

export function HomeTopCompanies({ companies, loading }: HomeTopCompaniesProps) {
  const { t } = useApp()
  const railRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: -1 | 1) => {
    const el = railRef.current
    if (!el) return
    el.scrollBy({ left: dir * Math.min(360, el.clientWidth * 0.8), behavior: 'smooth' })
  }

  return (
    <section className="home-section layout-page-gutter" aria-labelledby="home-companies-rail-title">
      <div className="home-section__head">
        <div>
          <p className="home-section__eyebrow">{t('homePremium.topCompaniesEyebrow')}</p>
          <h2 id="home-companies-rail-title" className="home-section__title">
            {t('homePremium.topCompaniesTitle')}
          </h2>
          <p className="home-section__subtitle">{t('homePremium.topCompaniesSubtitle')}</p>
        </div>
        <div className="home-carousel-nav">
          <button type="button" onClick={() => scroll(-1)} aria-label={t('common.previous')}>
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => scroll(1)} aria-label={t('common.next')}>
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="home-section__link"
            onClick={() => navigateTo('/companies')}
          >
            {t('homePremium.seeAllCompanies')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="home-rail home-rail--pros" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="home-pro-card home-pro-card--skeleton" />
          ))}
        </div>
      ) : companies.length === 0 ? (
        <p className="home-section__empty">{t('home.noCompanies')}</p>
      ) : (
        <div ref={railRef} className="home-rail home-rail--pros" role="list">
          {companies.map((company) => {
            const name = formatProfessionalCardTitle(company, t('professional.defaultName'))
            const avatar = resolveDirectoryAvatarUrl(
              company.id,
              company.profile_photo,
              company.avatar_url,
            )
            const langs = (company.languages ?? []).slice(0, 3)
            const location = (company.location || '').trim()
            const phone = (company.phone ?? '').trim()
            const websiteHref = normalizeWebsiteHref(company.website)
            const websiteLabel = websiteHref ? websiteDisplayLabel(websiteHref) : ''

            return (
              <article key={company.id} className="home-pro-card" role="listitem">
                <button
                  type="button"
                  className="home-pro-card__hit"
                  onClick={() => navigateTo(`/professional/${company.id}`)}
                >
                  <div className="home-pro-card__avatar">
                    {avatar ? (
                      <img src={avatar} alt="" loading="lazy" />
                    ) : (
                      <span className="inline-flex items-center justify-center">
                        <Building2 className="h-6 w-6" aria-hidden />
                      </span>
                    )}
                  </div>
                  <div className="home-pro-card__info">
                    <div className="home-pro-card__name-row">
                      <h3>{name}</h3>
                      {company.is_verified ? (
                        <span className="home-pro-card__verified">
                          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                          {t('homePremium.verified')}
                        </span>
                      ) : null}
                    </div>
                    <p className="home-pro-card__rating">
                      <Star className="h-4 w-4 fill-[#ff9900] text-[#ff9900]" aria-hidden />
                      {(company.rating ?? 0) > 0
                        ? Number(company.rating).toFixed(1)
                        : t('professional.new')}
                      <span>
                        · {company.completed_jobs ?? 0} {t('homePremium.completedProjects')}
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
                  onClick={() => navigateTo(`/professional/${company.id}`)}
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
