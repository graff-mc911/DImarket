import {
  ArrowRight,
  Briefcase,
  Clock3,
  Languages,
  ShieldCheck,
  Star,
  UserRound,
} from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { navigateTo } from '../../lib/navigation'
import { formatProfessionalCardTitle } from '../../lib/professionalDisplay'
import type { Profile } from '../../lib/types'

interface CategoryFeaturedProsProps {
  professionals: Profile[]
  categorySlug: string
  title?: string
  emptyLabel?: string
  sectionId?: string
}

export function CategoryFeaturedPros({
  professionals,
  categorySlug,
  title,
  emptyLabel,
  sectionId = 'cat-featured-pros',
}: CategoryFeaturedProsProps) {
  const { t } = useApp()
  const featured = [...professionals]
    .sort((a, b) => {
      const verifiedDelta = Number(Boolean(b.is_verified)) - Number(Boolean(a.is_verified))
      if (verifiedDelta !== 0) return verifiedDelta
      const ratingDelta = Number(b.rating ?? 0) - Number(a.rating ?? 0)
      if (ratingDelta !== 0) return ratingDelta
      return Number(b.completed_jobs ?? 0) - Number(a.completed_jobs ?? 0)
    })
    .slice(0, 6)

  return (
    <section className="cat-section" aria-labelledby={sectionId}>
      <div className="cat-section__head">
        <h2 id={sectionId}>{title ?? t('marketplace.featuredProfessionals')}</h2>
        <button
          type="button"
          className="cat-section__link"
          onClick={() =>
            navigateTo(`/professionals?category=${encodeURIComponent(categorySlug)}`)
          }
        >
          {t('marketplace.viewAllPros')}
        </button>
      </div>
      {featured.length === 0 ? (
        <p className="cat-section__empty">{emptyLabel ?? t('marketplace.noPros')}</p>
      ) : (
        <div className="cat-pro-grid">
          {featured.map((pro) => (
            <FeaturedProfessionalCard key={pro.id} professional={pro} />
          ))}
        </div>
      )}
    </section>
  )
}

function responseTimeLabel(professional: Profile, sameDayLabel: string): string {
  const rate = Number(professional.response_rate ?? 0)
  if (rate >= 90) return '< 1h'
  if (rate >= 70) return '< 2h'
  return sameDayLabel
}

function FeaturedProfessionalCard({ professional }: { professional: Profile }) {
  const { t } = useApp()
  const name = formatProfessionalCardTitle(professional, t('professional.defaultName'))
  const avatar = professional.profile_photo || professional.avatar_url
  const rating =
    Number(professional.rating ?? 0) > 0
      ? Number(professional.rating).toFixed(1)
      : t('professional.new')
  const languages = (professional.languages ?? []).slice(0, 3)

  return (
    <article className="cat-featured-pro-card">
      <div className="cat-featured-pro-card__top">
        {avatar ? (
          <img src={avatar} alt={name} loading="lazy" />
        ) : (
          <span className="cat-featured-pro-card__avatar-empty" aria-hidden>
            <UserRound className="h-7 w-7" />
          </span>
        )}
        <div className="cat-featured-pro-card__identity">
          <h3>{name}</h3>
          <p>{professional.location || t('professional.global')}</p>
        </div>
        {professional.is_verified ? (
          <span className="cat-featured-pro-card__verified">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            {t('professional.verified')}
          </span>
        ) : null}
      </div>

      <dl className="cat-featured-pro-card__stats">
        <div>
          <dt>
            <Star className="h-3.5 w-3.5 fill-[#ff9900] text-[#ff9900]" aria-hidden />
            {t('marketplace.avgRating')}
          </dt>
          <dd>{rating}</dd>
        </div>
        <div>
          <dt>
            <Briefcase className="h-3.5 w-3.5" aria-hidden />
            {t('marketplace.completedProjects')}
          </dt>
          <dd>{professional.completed_jobs ?? 0}</dd>
        </div>
        <div>
          <dt>
            <Clock3 className="h-3.5 w-3.5" aria-hidden />
            {t('homePremium.responseTime')}
          </dt>
          <dd>{responseTimeLabel(professional, t('catPage.responseSameDay'))}</dd>
        </div>
        <div>
          <dt>
            <Languages className="h-3.5 w-3.5" aria-hidden />
            {t('advancedSearch.languages')}
          </dt>
          <dd>{languages.length > 0 ? languages.join(', ').toUpperCase() : 'EN'}</dd>
        </div>
      </dl>

      <button
        type="button"
        className="cat-featured-pro-card__cta"
        onClick={() => navigateTo(`/professional/${professional.id}`)}
        aria-label={`${t('homePremium.viewProfile')}: ${name}`}
      >
        {t('homePremium.viewProfile')}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
    </article>
  )
}
