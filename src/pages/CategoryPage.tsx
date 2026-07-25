import type { ReactNode } from 'react'
import {
  ArrowRight,
  Filter,
  MapPin,
  Search,
  Sparkles,
  Star,
  Users,
  Wrench,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ProfessionalCard } from '../components/ProfessionalCard'
import { useApp } from '../contexts/AppContext'
import { resolveCategoryIcon } from '../lib/categoryIcons'
import { listingCityLabel } from '../lib/listingLocation'
import {
  fetchMarketplaceCategoryPage,
  marketplaceCategoryDescription,
  marketplaceCategoryLabel,
  marketplaceServiceProsPath,
  type MarketplaceCategory,
  type MarketplaceCategoryPage,
} from '../lib/marketplaceCategories'
import { navigateTo } from '../lib/navigation'
import type { ListingWithImages } from '../lib/types'

interface CategoryPageProps {
  slug: string
}

export function CategoryPage({ slug }: CategoryPageProps) {
  const { language, t } = useApp()
  const [page, setPage] = useState<MarketplaceCategoryPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [minRating, setMinRating] = useState(0)
  const [verifiedOnly, setVerifiedOnly] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const data = await fetchMarketplaceCategoryPage(slug)
        if (!cancelled) setPage(data)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [slug])

  const category = page?.category ?? null
  const Icon = resolveCategoryIcon(category?.icon_key)
  const title = category ? marketplaceCategoryLabel(category, language.code) : slug
  const description = category
    ? marketplaceCategoryDescription(category, language.code)
    : ''

  useEffect(() => {
    const prev = document.title
    document.title = category
      ? `${title} | DImarket`
      : `Category | DImarket`
    const meta = document.querySelector('meta[name="description"]')
    if (meta && description) meta.setAttribute('content', description)
    return () => {
      document.title = prev
    }
  }, [category, title, description])

  const services = useMemo(() => {
    const list = page?.services ?? []
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter((s) =>
      marketplaceCategoryLabel(s, language.code).toLowerCase().includes(q),
    )
  }, [page?.services, search, language.code])

  const professionals = useMemo(() => {
    let list = page?.professionals ?? []
    if (minRating > 0) list = list.filter((p) => (p.rating ?? 0) >= minRating)
    if (verifiedOnly) list = list.filter((p) => p.is_verified)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (p) =>
          (p.full_name ?? '').toLowerCase().includes(q) ||
          (p.location ?? '').toLowerCase().includes(q) ||
          (p.bio ?? '').toLowerCase().includes(q),
      )
    }
    return list
  }, [page?.professionals, minRating, verifiedOnly, search])

  const projects = page?.projects ?? []

  const aiTips = useMemo(() => {
    if (!category) return []
    const topServices = (page?.services ?? []).slice(0, 3)
    return [
      t('marketplace.aiTipPros').replace('{category}', title),
      topServices[0]
        ? t('marketplace.aiTipService').replace(
            '{service}',
            marketplaceCategoryLabel(topServices[0], language.code),
          )
        : t('marketplace.aiTipPost'),
      t('marketplace.aiTipEstimate'),
    ]
  }, [category, page?.services, title, language.code, t])

  if (loading) {
    return (
      <div className="category-page category-page--loading layout-page-gutter py-16">
        <p className="text-[var(--ink-600)]">{t('marketplace.loading')}</p>
      </div>
    )
  }

  if (!page?.ok || !category) {
    return (
      <div className="category-page layout-page-gutter py-16 text-center">
        <h1 className="text-2xl font-bold text-[var(--ink-900)]">{t('marketplace.notFound')}</h1>
        <button
          type="button"
          className="mt-6 text-[#c96d2c] font-semibold"
          onClick={() => navigateTo('/#choose-category')}
        >
          {t('marketplace.backToCategories')}
        </button>
      </div>
    )
  }

  const cover =
    category.cover_image_url ||
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=80'

  return (
    <div className="category-page">
      <header className="category-page__hero">
        <img src={cover} alt="" className="category-page__hero-image" />
        <div className="category-page__hero-overlay" />
        <div className="category-page__hero-content layout-page-gutter">
          <div className="category-page__hero-icon" aria-hidden>
            {category.icon ? (
              <span className="text-4xl">{category.icon}</span>
            ) : (
              <Icon className="h-10 w-10" strokeWidth={1.6} />
            )}
          </div>
          <h1 className="category-page__hero-title">{title}</h1>
          {description ? (
            <p className="category-page__hero-desc">{description}</p>
          ) : null}
          <div className="category-page__stats">
            <StatPill
              icon={<Wrench className="h-4 w-4" />}
              label={t('marketplace.services')}
              value={String(category.services_count ?? services.length)}
            />
            <StatPill
              icon={<Users className="h-4 w-4" />}
              label={t('marketplace.professionals')}
              value={String(category.professionals_count ?? professionals.length)}
            />
            <StatPill
              icon={<Star className="h-4 w-4" />}
              label={t('marketplace.avgRating')}
              value={
                category.avg_rating != null && Number(category.avg_rating) > 0
                  ? Number(category.avg_rating).toFixed(1)
                  : '—'
              }
            />
          </div>
        </div>
      </header>

      <div className="layout-page-gutter category-page__body">
        <div className="category-page__toolbar">
          <label className="category-page__search">
            <Search className="h-4 w-4 text-[#b07e55]" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('marketplace.searchInCategory')}
              aria-label={t('marketplace.searchInCategory')}
            />
          </label>
          <div className="category-page__filters">
            <Filter className="h-4 w-4 text-[#b07e55]" aria-hidden />
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              aria-label={t('marketplace.minRating')}
            >
              <option value={0}>{t('marketplace.anyRating')}</option>
              <option value={3}>3+</option>
              <option value={4}>4+</option>
              <option value={4.5}>4.5+</option>
            </select>
            <label className="category-page__check">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
              />
              {t('marketplace.verifiedOnly')}
            </label>
          </div>
        </div>

        <section className="category-page__section" aria-labelledby="cat-services">
          <div className="category-page__section-head">
            <h2 id="cat-services">{t('marketplace.services')}</h2>
            <p>{t('marketplace.servicesHint')}</p>
          </div>
          <div className="category-service-grid">
            {services.map((service) => (
              <ServiceTile
                key={service.id}
                service={service}
                categorySlug={category.slug}
                lang={language.code}
              />
            ))}
          </div>
        </section>

        <section className="category-page__section" aria-labelledby="cat-ai">
          <div className="category-page__section-head">
            <h2 id="cat-ai" className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#ff9900]" aria-hidden />
              {t('marketplace.aiRecommendations')}
            </h2>
          </div>
          <div className="category-ai-grid">
            {aiTips.map((tip) => (
              <div key={tip} className="category-ai-card">
                <p>{tip}</p>
                <button
                  type="button"
                  onClick={() => navigateTo('/assistant')}
                  className="category-ai-card__cta"
                >
                  {t('marketplace.openAssistant')}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="category-page__section" aria-labelledby="cat-pros">
          <div className="category-page__section-head">
            <h2 id="cat-pros">{t('marketplace.featuredProfessionals')}</h2>
            <button
              type="button"
              className="category-page__link"
              onClick={() =>
                navigateTo(`/professionals?category=${encodeURIComponent(category.slug)}`)
              }
            >
              {t('marketplace.viewAllPros')}
            </button>
          </div>
          {professionals.length === 0 ? (
            <p className="category-page__empty">{t('marketplace.noPros')}</p>
          ) : (
            <div className="category-pro-grid">
              {professionals.map((pro) => (
                <ProfessionalCard key={pro.id} professional={pro} showStatusBadges />
              ))}
            </div>
          )}
        </section>

        <section className="category-page__section" aria-labelledby="cat-projects">
          <div className="category-page__section-head">
            <h2 id="cat-projects">{t('marketplace.recentProjects')}</h2>
            <button
              type="button"
              className="category-page__link"
              onClick={() => navigateTo('/listings')}
            >
              {t('marketplace.viewAllProjects')}
            </button>
          </div>
          {projects.length === 0 ? (
            <p className="category-page__empty">{t('marketplace.noProjects')}</p>
          ) : (
            <div className="category-project-grid">
              {projects.map((project) => (
                <ProjectTile key={project.id} project={project} t={t} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function StatPill({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="category-stat-pill">
      <span className="category-stat-pill__icon">{icon}</span>
      <div>
        <p className="category-stat-pill__value">{value}</p>
        <p className="category-stat-pill__label">{label}</p>
      </div>
    </div>
  )
}

function ServiceTile({
  service,
  categorySlug,
  lang,
}: {
  service: MarketplaceCategory
  categorySlug: string
  lang: string
}) {
  const label = marketplaceCategoryLabel(service, lang)
  return (
    <button
      type="button"
      className="category-service-tile"
      onClick={() => navigateTo(marketplaceServiceProsPath(service.slug, categorySlug))}
    >
      <span className="category-service-tile__title">{label}</span>
      <ArrowRight className="h-4 w-4 opacity-50 transition group-hover:opacity-100" />
    </button>
  )
}

function ProjectTile({
  project,
  t,
}: {
  project: ListingWithImages
  t: (key: never) => string
}) {
  const city = listingCityLabel(project.city_name || project.location)
  return (
    <button
      type="button"
      className="category-project-tile"
      onClick={() => navigateTo(`/listing/${project.id}`)}
    >
      <h3>{project.title}</h3>
      {(city || project.location) && (
        <p className="category-project-tile__loc">
          <MapPin className="h-3.5 w-3.5" />
          {city || project.location}
        </p>
      )}
      <p className="category-project-tile__cta">{t('marketplace.viewProject' as never)}</p>
    </button>
  )
}
