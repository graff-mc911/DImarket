import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  BadgeCheck,
  Building2,
  Clock,
  Crown,
  ExternalLink,
  Globe2,
  Mail,
  MapPin,
  Phone,
  Star,
  Users,
} from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useApp } from '../contexts/AppContext'
import { companyCategoryLabel } from '../lib/companies/categories'
import { companyCountryFlag, fetchCompanyBySlug } from '../lib/companies/companies'
import { formatOpeningHoursSummary, isCompanyOpenNow } from '../lib/companies/hours'
import type { CompanyDetail as CompanyDetailType } from '../lib/companies/types'
import { navigateTo } from '../lib/navigation'

type Props = {
  slug: string
}

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: ReactNode
}) {
  return (
    <section id={id} className="amazon-section-card scroll-mt-24" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="text-lg font-bold text-[var(--ink-900)]">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function MiniMap({
  lat,
  lng,
  name,
}: {
  lat: number
  lng: number
  name: string
}) {
  const mapEl = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapEl.current) return
    const map = L.map(mapEl.current, {
      center: [lat, lng],
      zoom: 12,
      scrollWheelZoom: false,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map)
    L.marker([lat, lng]).addTo(map).bindPopup(name)
    window.setTimeout(() => map.invalidateSize(), 80)
    return () => {
      map.remove()
    }
  }, [lat, lng, name])

  return (
    <div
      ref={mapEl}
      className="h-64 w-full overflow-hidden rounded-xl"
      role="region"
      aria-label={name}
    />
  )
}

export function CompanyDetail({ slug }: Props) {
  const { t } = useApp()
  const [company, setCompany] = useState<CompanyDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void fetchCompanyBySlug(slug).then((data) => {
      if (cancelled) return
      setCompany(data)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [slug])

  useEffect(() => {
    if (!company) return
    const prev = document.title
    document.title = `${company.name} | DImarket`
    const meta = document.querySelector('meta[name="description"]')
    const prevDesc = meta?.getAttribute('content') || ''
    const desc =
      company.short_description ||
      t('companiesDir.profileSeo').replace('{name}', company.name)
    meta?.setAttribute('content', desc)

    const ogTitle = document.querySelector('meta[property="og:title"]')
    const ogDesc = document.querySelector('meta[property="og:description"]')
    const ogImage = document.querySelector('meta[property="og:image"]')
    const prevOgTitle = ogTitle?.getAttribute('content') || ''
    const prevOgDesc = ogDesc?.getAttribute('content') || ''
    const prevOgImage = ogImage?.getAttribute('content') || ''
    ogTitle?.setAttribute('content', company.name)
    ogDesc?.setAttribute('content', desc)
    if (company.cover_url || company.logo_url) {
      ogImage?.setAttribute('content', company.cover_url || company.logo_url || '')
    }

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = 'company-profile-jsonld'
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: company.name,
      description: desc,
      url: `https://dimarket.app/companies/${company.slug}`,
      image: company.cover_url || company.logo_url || undefined,
      telephone: company.phone || undefined,
      address: {
        '@type': 'PostalAddress',
        addressLocality: company.city || undefined,
        addressCountry: company.country_code || undefined,
        streetAddress: company.address || undefined,
      },
      aggregateRating:
        company.reviews_count > 0
          ? {
              '@type': 'AggregateRating',
              ratingValue: company.rating,
              reviewCount: company.reviews_count,
            }
          : undefined,
    })
    document.getElementById('company-profile-jsonld')?.remove()
    document.head.appendChild(script)

    return () => {
      document.title = prev
      meta?.setAttribute('content', prevDesc)
      ogTitle?.setAttribute('content', prevOgTitle)
      ogDesc?.setAttribute('content', prevOgDesc)
      ogImage?.setAttribute('content', prevOgImage)
      document.getElementById('company-profile-jsonld')?.remove()
    }
  }, [company, t])

  if (loading) {
    return (
      <div className="layout-page-gutter py-10">
        <div className="layout-page-content space-y-4">
          <div className="h-48 animate-pulse rounded-[18px] bg-[#f0f0f2]" />
          <div className="h-40 animate-pulse rounded-[18px] bg-[#f0f0f2]" />
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="layout-page-gutter py-16 text-center">
        <p className="text-[15px] font-semibold text-[var(--ink-900)]">
          {t('companiesDir.notFound')}
        </p>
        <button
          type="button"
          className="btn-primary mt-4 text-sm"
          onClick={() => navigateTo('/companies')}
        >
          {t('companiesDir.backToDirectory')}
        </button>
      </div>
    )
  }

  const flag = companyCountryFlag(company.country_code)
  const open = isCompanyOpenNow(company.opening_hours)
  const socialEntries = Object.entries(company.social || {}).filter(
    ([, v]) => typeof v === 'string' && v,
  )

  const navLinks = [
    { id: 'about', label: t('companiesDir.about') },
    { id: 'services', label: t('companiesDir.services') },
    { id: 'portfolio', label: t('companiesDir.portfolio') },
    { id: 'gallery', label: t('companiesDir.gallery') },
    { id: 'team', label: t('companiesDir.team') },
    { id: 'certificates', label: t('companiesDir.certificates') },
    { id: 'licenses', label: t('companiesDir.licenses') },
    { id: 'brands', label: t('companiesDir.brands') },
    { id: 'reviews', label: t('companiesDir.reviewsSection') },
    { id: 'contact', label: t('companiesDir.contact') },
  ]

  return (
    <div className="layout-page-gutter pb-12 pt-4">
      <div className="layout-page-content space-y-4">
        <nav aria-label="Breadcrumb" className="text-[12px] text-[#6e6e73]">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <button type="button" className="amazon-link" onClick={() => navigateTo('/companies')}>
                {t('companiesDir.directory')}
              </button>
            </li>
            <li aria-hidden>/</li>
            <li className="font-semibold text-[#1d1d1f]">{company.name}</li>
          </ol>
        </nav>

        {/* Hero banner */}
        <section className="amazon-section-card overflow-hidden !p-0">
          <div className="relative h-44 bg-[#f5f5f7] sm:h-56">
            {company.cover_url ? (
              <img
                src={company.cover_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[#d2d2d7]">
                <Building2 className="h-16 w-16" aria-hidden />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4 px-4 pb-5 pt-0 sm:flex-row sm:items-end sm:px-6">
            <div className="-mt-10 h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-[#f5f5f7] shadow-md sm:h-24 sm:w-24">
              {company.logo_url ? (
                <img src={company.logo_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-xl font-bold">
                  {company.name.slice(0, 1)}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1 sm:pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-[var(--ink-900)]">{company.name}</h1>
                {company.is_verified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                    {t('companiesDir.verified')}
                  </span>
                ) : null}
                {company.is_premium ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4e5] px-2 py-0.5 text-[11px] font-semibold text-[#b86a00]">
                    <Crown className="h-3.5 w-3.5" aria-hidden />
                    {t('companiesDir.premium')}
                  </span>
                ) : null}
                {open ? (
                  <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                    {t('companiesDir.openNow')}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-[13px] text-[#6e6e73]">
                {companyCategoryLabel(company.category_slug, t)}
                {' · '}
                {flag} {[company.city, company.country_name].filter(Boolean).join(', ')}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[13px] text-[#6e6e73]">
                <span className="inline-flex items-center gap-1 font-semibold text-[#1d1d1f]">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                  {company.rating.toFixed(1)} ({company.reviews_count})
                </span>
                <span>
                  {company.completed_projects} {t('companiesDir.projects')}
                </span>
                {company.employees_count != null ? (
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" aria-hidden />
                    {company.employees_count}
                  </span>
                ) : null}
                {company.founded_year ? (
                  <span>
                    {t('companiesDir.founded')} {company.founded_year}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:pb-1">
              {company.phone ? (
                <a href={`tel:${company.phone}`} className="btn-primary text-sm">
                  <Phone className="mr-1 inline h-4 w-4" aria-hidden />
                  {t('companiesDir.call')}
                </a>
              ) : null}
              {company.website ? (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-sm"
                >
                  <ExternalLink className="mr-1 inline h-4 w-4" aria-hidden />
                  {t('companiesDir.website')}
                </a>
              ) : null}
            </div>
          </div>
        </section>

        {/* Section nav */}
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          role="navigation"
          aria-label={t('companiesDir.sections')}
        >
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className="shrink-0 rounded-full bg-[#f5f5f7] px-3 py-1.5 text-[12px] font-semibold text-[#1d1d1f] hover:bg-[#e8e8ed]"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            <Section id="about" title={t('companiesDir.about')}>
              <p className="text-[14px] leading-relaxed text-[#3a3a3c] whitespace-pre-line">
                {company.about || company.short_description || t('companiesDir.noDescription')}
              </p>
            </Section>

            {company.services.length > 0 ? (
              <Section id="services" title={t('companiesDir.services')}>
                <ul className="space-y-3">
                  {company.services.map((s) => (
                    <li key={s.id} className="rounded-xl bg-[#fafafa] px-3 py-2">
                      <p className="text-[14px] font-semibold text-[#1d1d1f]">{s.name}</p>
                      {s.description ? (
                        <p className="mt-0.5 text-[13px] text-[#6e6e73]">{s.description}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}

            {company.portfolio.length > 0 ? (
              <Section id="portfolio" title={t('companiesDir.portfolio')}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {company.portfolio.map((p) => (
                    <article key={p.id} className="overflow-hidden rounded-xl border border-[#e8e8ed]">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt=""
                          className="h-36 w-full object-cover"
                          loading="lazy"
                        />
                      ) : null}
                      <div className="p-3">
                        <p className="text-[14px] font-semibold text-[#1d1d1f]">{p.title}</p>
                        {p.description ? (
                          <p className="mt-1 text-[12px] text-[#6e6e73]">{p.description}</p>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </Section>
            ) : (
              <div id="portfolio" />
            )}

            {company.gallery.length > 0 ? (
              <Section id="gallery" title={t('companiesDir.gallery')}>
                <div className="flex flex-wrap gap-2">
                  {company.gallery.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setLightbox(g.url)}
                      className="h-24 w-24 overflow-hidden rounded-xl sm:h-28 sm:w-28"
                      aria-label={g.caption || t('companiesDir.gallery')}
                    >
                      <img
                        src={g.url}
                        alt={g.caption || ''}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              </Section>
            ) : (
              <div id="gallery" />
            )}

            {company.team.length > 0 ? (
              <Section id="team" title={t('companiesDir.team')}>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {company.team.map((m) => (
                    <li key={m.id} className="flex items-center gap-3 rounded-xl bg-[#fafafa] p-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8e8ed] text-sm font-bold">
                        {m.name.slice(0, 1)}
                      </span>
                      <div>
                        <p className="text-[14px] font-semibold text-[#1d1d1f]">{m.name}</p>
                        {m.role_title ? (
                          <p className="text-[12px] text-[#6e6e73]">{m.role_title}</p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </Section>
            ) : (
              <div id="team" />
            )}

            {company.certificates.length > 0 ? (
              <Section id="certificates" title={t('companiesDir.certificates')}>
                <ul className="space-y-2">
                  {company.certificates.map((c) => (
                    <li key={c.id} className="text-[13px] text-[#3a3a3c]">
                      <span className="font-semibold text-[#1d1d1f]">{c.title}</span>
                      {c.issuer ? ` · ${c.issuer}` : ''}
                      {c.year ? ` · ${c.year}` : ''}
                    </li>
                  ))}
                </ul>
              </Section>
            ) : (
              <div id="certificates" />
            )}

            {company.licenses.length > 0 ? (
              <Section id="licenses" title={t('companiesDir.licenses')}>
                <ul className="space-y-2">
                  {company.licenses.map((l) => (
                    <li key={l.id} className="text-[13px] text-[#3a3a3c]">
                      <span className="font-semibold text-[#1d1d1f]">{l.title}</span>
                      {l.license_number ? ` · ${l.license_number}` : ''}
                      {l.issuer ? ` · ${l.issuer}` : ''}
                    </li>
                  ))}
                </ul>
              </Section>
            ) : (
              <div id="licenses" />
            )}

            {company.brands.length > 0 ? (
              <Section id="brands" title={t('companiesDir.brands')}>
                <div className="flex flex-wrap gap-2">
                  {company.brands.map((b) => (
                    <span
                      key={b.id}
                      className="rounded-full bg-[#f5f5f7] px-3 py-1.5 text-[12px] font-semibold text-[#1d1d1f]"
                    >
                      {b.name}
                    </span>
                  ))}
                </div>
              </Section>
            ) : (
              <div id="brands" />
            )}

            <Section id="reviews" title={t('companiesDir.reviewsSection')}>
              {company.reviews.length === 0 ? (
                <p className="text-[13px] text-[#6e6e73]">{t('companiesDir.noReviews')}</p>
              ) : (
                <ul className="space-y-3">
                  {company.reviews.map((r) => (
                    <li key={r.id} className="rounded-xl border border-[#e8e8ed] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[13px] font-semibold text-[#1d1d1f]">
                          {r.reviewer_name}
                          {r.is_verified ? (
                            <span className="ml-2 text-[11px] font-semibold text-emerald-700">
                              {t('companiesDir.verified')}
                            </span>
                          ) : null}
                        </p>
                        <span className="inline-flex items-center gap-1 text-[12px] font-semibold">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                          {r.rating}
                        </span>
                      </div>
                      {r.comment ? (
                        <p className="mt-1 text-[13px] leading-relaxed text-[#3a3a3c]">{r.comment}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <Section id="contact" title={t('companiesDir.contact')}>
              <ul className="space-y-2 text-[13px] text-[#3a3a3c]">
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#86868b]" aria-hidden />
                  <span>
                    {company.address || [company.city, company.country_name].filter(Boolean).join(', ')}
                  </span>
                </li>
                {company.phone ? (
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0 text-[#86868b]" aria-hidden />
                    <a href={`tel:${company.phone}`} className="amazon-link">
                      {company.phone}
                    </a>
                  </li>
                ) : null}
                {company.email ? (
                  <li className="flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0 text-[#86868b]" aria-hidden />
                    <a href={`mailto:${company.email}`} className="amazon-link">
                      {company.email}
                    </a>
                  </li>
                ) : null}
                {company.website ? (
                  <li className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 shrink-0 text-[#86868b]" aria-hidden />
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="amazon-link truncate"
                    >
                      {company.website.replace(/^https?:\/\//, '')}
                    </a>
                  </li>
                ) : null}
                {company.languages.length ? (
                  <li className="flex items-center gap-2">
                    <Globe2 className="h-4 w-4 shrink-0 text-[#86868b]" aria-hidden />
                    {company.languages.map((l) => l.toUpperCase()).join(', ')}
                  </li>
                ) : null}
              </ul>
            </Section>

            <section className="amazon-section-card" aria-labelledby="hours-title">
              <h2 id="hours-title" className="flex items-center gap-2 text-lg font-bold text-[var(--ink-900)]">
                <Clock className="h-5 w-5" aria-hidden />
                {t('companiesDir.workingHours')}
              </h2>
              <p className="mt-3 text-[13px] leading-relaxed text-[#3a3a3c]">
                {formatOpeningHoursSummary(company.opening_hours, t)}
              </p>
            </section>

            {company.latitude != null && company.longitude != null ? (
              <section className="amazon-section-card" aria-labelledby="map-title">
                <h2 id="map-title" className="text-lg font-bold text-[var(--ink-900)]">
                  {t('companiesDir.map')}
                </h2>
                <div className="mt-3">
                  <MiniMap
                    lat={company.latitude}
                    lng={company.longitude}
                    name={company.name}
                  />
                </div>
              </section>
            ) : null}

            {socialEntries.length > 0 ? (
              <section className="amazon-section-card" aria-labelledby="social-title">
                <h2 id="social-title" className="text-lg font-bold text-[var(--ink-900)]">
                  {t('companiesDir.social')}
                </h2>
                <ul className="mt-3 space-y-2">
                  {socialEntries.map(([key, url]) => (
                    <li key={key}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="amazon-link text-[13px] font-semibold capitalize"
                      >
                        {key}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </aside>
        </div>
      </div>

      {lightbox ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label={t('companiesDir.gallery')}
        >
          <img
            src={lightbox}
            alt=""
            className="max-h-[85vh] max-w-3xl rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  )
}
