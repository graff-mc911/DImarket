import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  AlertTriangle,
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  Building2,
  Clock,
  Crown,
  ExternalLink,
  Flag,
  Globe2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  Star,
  Zap,
} from 'lucide-react'
import { PortfolioManager } from '../components/portfolio/PortfolioManager'
import { ReviewFeed } from '../components/reviews/ReviewFeed'
import { useApp } from '../contexts/AppContext'
import { recordProfileView } from '../lib/analytics/analytics'
import { categoryLabel } from '../lib/portfolio'
import { navigateTo } from '../lib/navigation'
import {
  fetchPremiumProfileBundle,
  formatAvailability,
  formatPriceRange,
  formatResponseTime,
  formatWorkingHours,
  groupServicesByCategory,
  proCountryFlag,
  proProfilePath,
  reportProfessionalProfile,
  shareProProfile,
  type PremiumProfile,
  type PremiumProfileBundle,
} from '../lib/proProfile'
import { supabase } from '../lib/supabase'

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

function Skeleton() {
  return (
    <div className="layout-page-gutter py-6" aria-busy="true" aria-live="polite">
      <div className="layout-page-content space-y-4">
        <div className="h-48 animate-pulse rounded-[18px] bg-[#f0f0f2]" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            <div className="h-40 animate-pulse rounded-[18px] bg-[#f0f0f2]" />
            <div className="h-56 animate-pulse rounded-[18px] bg-[#f0f0f2]" />
          </div>
          <div className="h-80 animate-pulse rounded-[18px] bg-[#f0f0f2]" />
        </div>
      </div>
    </div>
  )
}

function WorkAreaMap({
  lat,
  lng,
  radiusKm,
  name,
}: {
  lat: number
  lng: number
  radiusKm: number | null
  name: string
}) {
  const mapEl = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapEl.current) return
    const map = L.map(mapEl.current, {
      center: [lat, lng],
      zoom: radiusKm && radiusKm > 80 ? 7 : 10,
      scrollWheelZoom: false,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map)
    L.marker([lat, lng]).addTo(map).bindPopup(name)
    if (radiusKm && radiusKm > 0) {
      L.circle([lat, lng], {
        radius: radiusKm * 1000,
        color: '#007185',
        fillColor: '#007185',
        fillOpacity: 0.12,
        weight: 2,
      }).addTo(map)
    }
    window.setTimeout(() => map.invalidateSize(), 80)
    return () => {
      map.remove()
    }
  }, [lat, lng, radiusKm, name])

  return (
    <div
      ref={mapEl}
      className="h-64 w-full overflow-hidden rounded-xl"
      role="region"
      aria-label={name}
    />
  )
}

function SimilarCard({ pro }: { pro: PremiumProfile }) {
  const { t } = useApp()
  return (
    <button
      type="button"
      onClick={() => navigateTo(proProfilePath(pro))}
      className="flex w-full items-center gap-3 rounded-xl border border-[#e8e8ed] bg-white p-3 text-left transition hover:border-[#d2d2d7]"
    >
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#f5f5f7]">
        {pro.profile_photo || pro.avatar_url ? (
          <img
            src={pro.profile_photo || pro.avatar_url || ''}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-sm font-bold">
            {(pro.full_name || 'P').slice(0, 1)}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold text-[#1d1d1f]">
          {pro.full_name || t('proProfile.professional')}
        </p>
        <p className="truncate text-[12px] text-[#6e6e73]">
          {pro.profession || pro.city || pro.location || '—'}
        </p>
        <p className="mt-0.5 inline-flex items-center gap-1 text-[12px] font-semibold text-[#1d1d1f]">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
          {(pro.rating || 0).toFixed(1)}
        </p>
      </div>
    </button>
  )
}

export function PremiumProfessionalProfile({ slug }: Props) {
  const { user, profile: viewerProfile, t, language } = useApp()
  const [bundle, setBundle] = useState<PremiumProfileBundle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportMsg, setReportMsg] = useState<string | null>(null)
  const [shareMsg, setShareMsg] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    const data = await fetchPremiumProfileBundle(slug)
    if (!data) {
      setBundle(null)
      setError(t('proProfile.notFound'))
      setLoading(false)
      return
    }
    setBundle(data)
    setLoading(false)
    void recordProfileView(data.profile.id)
  }

  useEffect(() => {
    void load()
  }, [slug])

  useEffect(() => {
    if (!user || !bundle) return
    void supabase
      .from('saved_items')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_type', 'profile')
      .eq('item_id', bundle.profile.id)
      .maybeSingle()
      .then(({ data }) => setSaved(Boolean(data)))
  }, [user, bundle])

  useEffect(() => {
    if (!bundle) return
    const p = bundle.profile
    const title = `${p.full_name || 'Professional'} | DImarket`
    const desc =
      p.bio?.trim() ||
      t('proProfile.seoDescription')
        .replace('{name}', p.full_name || 'Professional')
        .replace('{city}', p.city || p.location || '')
    const prevTitle = document.title
    document.title = title
    const meta = document.querySelector('meta[name="description"]')
    const prevDesc = meta?.getAttribute('content') || ''
    meta?.setAttribute('content', desc)

    const ogTitle = document.querySelector('meta[property="og:title"]')
    const ogDesc = document.querySelector('meta[property="og:description"]')
    const ogImage = document.querySelector('meta[property="og:image"]')
    const prevOgTitle = ogTitle?.getAttribute('content') || ''
    const prevOgDesc = ogDesc?.getAttribute('content') || ''
    const prevOgImage = ogImage?.getAttribute('content') || ''
    ogTitle?.setAttribute('content', title)
    ogDesc?.setAttribute('content', desc)
    const image = p.cover_url || p.profile_photo || p.avatar_url
    if (image) ogImage?.setAttribute('content', image)

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = 'pro-profile-jsonld'
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: p.full_name,
      jobTitle: p.profession || undefined,
      url: `https://dimarket.app${proProfilePath(p)}`,
      image: image || undefined,
      telephone: p.phone || undefined,
      email: p.email_public || undefined,
      address: {
        '@type': 'PostalAddress',
        addressLocality: p.city || undefined,
        addressCountry: p.country_code || undefined,
      },
      worksFor: p.company_name
        ? { '@type': 'Organization', name: p.company_name }
        : undefined,
      aggregateRating:
        (p.total_reviews || 0) > 0
          ? {
              '@type': 'AggregateRating',
              ratingValue: p.rating,
              reviewCount: p.total_reviews,
            }
          : undefined,
    })
    document.getElementById('pro-profile-jsonld')?.remove()
    document.head.appendChild(script)

    return () => {
      document.title = prevTitle
      meta?.setAttribute('content', prevDesc)
      ogTitle?.setAttribute('content', prevOgTitle)
      ogDesc?.setAttribute('content', prevOgDesc)
      ogImage?.setAttribute('content', prevOgImage)
      document.getElementById('pro-profile-jsonld')?.remove()
    }
  }, [bundle, t])

  const serviceGroups = useMemo(
    () => (bundle ? groupServicesByCategory(bundle.services) : []),
    [bundle],
  )

  if (loading) return <Skeleton />

  if (!bundle) {
    return (
      <div className="layout-page-gutter py-16 text-center">
        <p className="text-[15px] font-semibold text-[var(--ink-900)]">
          {error || t('proProfile.notFound')}
        </p>
        <button
          type="button"
          className="btn-primary mt-4 text-sm"
          onClick={() => navigateTo('/professionals')}
        >
          {t('proProfile.backToCatalog')}
        </button>
      </div>
    )
  }

  const p = bundle.profile
  const flag = proCountryFlag(p.country_code)
  const avatar = p.profile_photo || p.avatar_url
  const cover =
    p.cover_url ||
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1400&h=420&fit=crop'
  const memberSince = new Date(p.created_at).toLocaleDateString(language?.code || undefined, {
    year: 'numeric',
    month: 'long',
  })
  const social = Object.entries(p.social_links || {}).filter(([, v]) => Boolean(v))

  const toggleSave = async () => {
    if (!user) {
      navigateTo('/login')
      return
    }
    setSaving(true)
    try {
      if (saved) {
        await supabase
          .from('saved_items')
          .delete()
          .eq('user_id', user.id)
          .eq('item_type', 'profile')
          .eq('item_id', p.id)
        setSaved(false)
      } else {
        await supabase.from('saved_items').insert({
          user_id: user.id,
          item_type: 'profile',
          item_id: p.id,
        } as never)
        setSaved(true)
      }
    } finally {
      setSaving(false)
    }
  }

  const startChat = () => {
    if (!user) {
      navigateTo('/login')
      return
    }
    sessionStorage.setItem('conversation_with', p.id)
    sessionStorage.removeItem('open_conversation')
    navigateTo('/messages')
  }

  const requestQuote = () => {
    if (!user) {
      navigateTo('/login')
      return
    }
    sessionStorage.setItem('quote_request_pro', p.id)
    navigateTo('/project/new')
  }

  const onShare = async () => {
    await shareProProfile(p)
    setShareMsg(t('proProfile.linkCopied'))
    window.setTimeout(() => setShareMsg(null), 2500)
  }

  const onReport = async () => {
    if (!user) {
      navigateTo('/login')
      return
    }
    const res = await reportProfessionalProfile({
      profileId: p.id,
      reporterId: user.id,
      reason: reportReason,
    })
    if (!res.ok) {
      setReportMsg(t('proProfile.reportError'))
      return
    }
    setReportMsg(t('proProfile.reportThanks'))
    setReportReason('')
    setReportOpen(false)
  }

  const nav = [
    { id: 'trust', label: t('proProfile.trust') },
    { id: 'about', label: t('proProfile.about') },
    { id: 'services', label: t('proProfile.services') },
    { id: 'portfolio', label: t('proProfile.portfolio') },
    { id: 'projects', label: t('proProfile.projectHistory') },
    { id: 'reviews', label: t('proProfile.reviews') },
    { id: 'area', label: t('proProfile.workingArea') },
    { id: 'hours', label: t('proProfile.workingHours') },
    { id: 'contact', label: t('proProfile.contact') },
  ]

  return (
    <div className="layout-page-gutter pb-12 pt-4">
      <div className="layout-page-content space-y-4">
        <nav aria-label="Breadcrumb" className="text-[12px] text-[#6e6e73]">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <button
                type="button"
                className="amazon-link"
                onClick={() => navigateTo('/professionals')}
              >
                {t('proProfile.professionals')}
              </button>
            </li>
            <li aria-hidden>/</li>
            <li className="font-semibold text-[#1d1d1f]">{p.full_name}</li>
          </ol>
        </nav>

        {/* Header */}
        <header className="amazon-section-card overflow-hidden !p-0">
          <div className="relative h-40 bg-[#f5f5f7] sm:h-52">
            <img
              src={cover}
              alt=""
              className="h-full w-full object-cover"
              loading="eager"
            />
          </div>
          <div className="flex flex-col gap-4 px-4 pb-5 pt-0 sm:flex-row sm:items-end sm:px-6">
            <div className="-mt-12 h-14 w-14 shrink-0 overflow-hidden rounded-full border-4 border-white bg-[#f5f5f7] shadow-md sm:-mt-14 sm:h-28 sm:w-28">
              {avatar ? (
                <img src={avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-xl font-bold text-[var(--accent-600)]">
                  {(p.full_name || 'P').slice(0, 1)}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1 sm:pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-[var(--ink-900)]">
                  {p.full_name || t('proProfile.professional')}
                </h1>
                {p.is_verified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                    {t('proProfile.verified')}
                  </span>
                ) : null}
                {p.is_premium ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4e5] px-2 py-0.5 text-[11px] font-semibold text-[#b86a00]">
                    <Crown className="h-3.5 w-3.5" aria-hidden />
                    {t('proProfile.premium')}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-[14px] text-[#6e6e73]">
                {p.profession || categoryLabel(p.work_subcategory_slugs?.[0])}
                {p.company_name ? (
                  <span className="ml-2 inline-flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" aria-hidden />
                    {p.company_name}
                  </span>
                ) : null}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-[#6e6e73]">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" aria-hidden />
                  {flag} {[p.city, p.country_name || p.location].filter(Boolean).join(', ') || '—'}
                </span>
                {p.languages?.length ? (
                  <span className="inline-flex items-center gap-1">
                    <Globe2 className="h-3.5 w-3.5" aria-hidden />
                    {p.languages.map((l) => l.toUpperCase()).join(', ')}
                  </span>
                ) : null}
                {p.years_experience != null ? (
                  <span>
                    {t('proProfile.yearsExp').replace('{n}', String(p.years_experience))}
                  </span>
                ) : null}
                <span>
                  {t('proProfile.memberSince')} {memberSince}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  {formatResponseTime(p.response_time_hours, t)}
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-[#067d62]">
                  <Zap className="h-3.5 w-3.5" aria-hidden />
                  {formatAvailability(p.availability_status, t)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2 border-t border-[#e8e8ed] px-4 py-3 sm:px-6">
            <button type="button" className="btn-primary text-sm" onClick={requestQuote}>
              {t('proProfile.requestQuote')}
            </button>
            <button type="button" className="btn-secondary text-sm" onClick={startChat}>
              <MessageCircle className="mr-1 inline h-4 w-4" aria-hidden />
              {t('proProfile.chat')}
            </button>
            {p.phone ? (
              <a href={`tel:${p.phone}`} className="btn-secondary text-sm">
                <Phone className="mr-1 inline h-4 w-4" aria-hidden />
                {t('proProfile.call')}
              </a>
            ) : null}
            <button
              type="button"
              className="btn-secondary text-sm"
              disabled={saving}
              onClick={() => void toggleSave()}
              aria-pressed={saved}
            >
              {saved ? (
                <BookmarkCheck className="mr-1 inline h-4 w-4" aria-hidden />
              ) : (
                <Bookmark className="mr-1 inline h-4 w-4" aria-hidden />
              )}
              {saved ? t('proProfile.saved') : t('proProfile.save')}
            </button>
            <button type="button" className="btn-secondary text-sm" onClick={() => void onShare()}>
              <Share2 className="mr-1 inline h-4 w-4" aria-hidden />
              {t('proProfile.share')}
            </button>
            <button
              type="button"
              className="btn-ghost text-sm text-[#6e6e73]"
              onClick={() => setReportOpen((v) => !v)}
            >
              <Flag className="mr-1 inline h-4 w-4" aria-hidden />
              {t('proProfile.report')}
            </button>
          </div>
          {shareMsg ? (
            <p className="px-4 pb-3 text-[12px] font-medium text-emerald-700 sm:px-6">{shareMsg}</p>
          ) : null}
          {reportMsg ? (
            <p className="px-4 pb-3 text-[12px] font-medium text-[#6e6e73] sm:px-6">{reportMsg}</p>
          ) : null}
          {reportOpen ? (
            <div className="space-y-2 border-t border-[#e8e8ed] px-4 py-3 sm:px-6">
              <label className="block text-[12px] font-semibold text-[#565959]">
                {t('proProfile.reportReason')}
                <input
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="input-glass mt-1 w-full text-sm"
                  placeholder={t('proProfile.reportPlaceholder')}
                />
              </label>
              <button
                type="button"
                className="btn-primary text-sm"
                disabled={!reportReason.trim()}
                onClick={() => void onReport()}
              >
                <AlertTriangle className="mr-1 inline h-4 w-4" aria-hidden />
                {t('proProfile.submitReport')}
              </button>
            </div>
          ) : null}
        </header>

        <div
          className="flex gap-2 overflow-x-auto pb-1"
          role="navigation"
          aria-label={t('proProfile.sections')}
        >
          {nav.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="shrink-0 rounded-full bg-[#f5f5f7] px-3 py-1.5 text-[12px] font-semibold text-[#1d1d1f] hover:bg-[#e8e8ed]"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            {/* Trust */}
            <Section id="trust" title={t('proProfile.trust')}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  {
                    label: t('proProfile.overallRating'),
                    value: `${(p.rating || 0).toFixed(1)} ★`,
                  },
                  {
                    label: t('proProfile.reviewsCount'),
                    value: String(p.total_reviews || 0),
                  },
                  {
                    label: t('proProfile.completedProjects'),
                    value: String(p.completed_jobs || bundle.projects.length || 0),
                  },
                  {
                    label: t('proProfile.repeatCustomers'),
                    value: String(p.repeat_customers || 0),
                  },
                  {
                    label: t('proProfile.recommendationRate'),
                    value:
                      p.recommendation_rate != null
                        ? `${p.recommendation_rate}%`
                        : '—',
                  },
                  {
                    label: t('proProfile.profileViews'),
                    value: String(p.profile_views || 0),
                  },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl bg-[#fafafa] px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#86868b]">
                      {stat.label}
                    </p>
                    <p className="mt-1 text-[18px] font-bold text-[#1d1d1f]">{stat.value}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="about" title={t('proProfile.about')}>
              <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[#3a3a3c]">
                {p.bio?.trim() || t('proProfile.noBio')}
              </p>
              {p.work_subcategory_slugs?.length ? (
                <div className="mt-4">
                  <p className="text-[12px] font-bold uppercase tracking-wide text-[#565959]">
                    {t('proProfile.specializations')}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {p.work_subcategory_slugs.map((slug) => (
                      <span
                        key={slug}
                        className="rounded-full bg-[#f5f5f7] px-3 py-1 text-[12px] font-semibold text-[#1d1d1f]"
                      >
                        {categoryLabel(slug)}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {(bundle.certificates.length > 0 || bundle.licenses.length > 0) && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {bundle.certificates.length > 0 ? (
                    <div>
                      <p className="text-[12px] font-bold uppercase tracking-wide text-[#565959]">
                        {t('proProfile.certificates')}
                      </p>
                      <ul className="mt-2 space-y-1 text-[13px] text-[#3a3a3c]">
                        {bundle.certificates.map((c) => (
                          <li key={c.id}>
                            <span className="font-semibold">{c.title}</span>
                            {c.issuer ? ` · ${c.issuer}` : ''}
                            {c.year ? ` · ${c.year}` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {bundle.licenses.length > 0 ? (
                    <div>
                      <p className="text-[12px] font-bold uppercase tracking-wide text-[#565959]">
                        {t('proProfile.licenses')}
                      </p>
                      <ul className="mt-2 space-y-1 text-[13px] text-[#3a3a3c]">
                        {bundle.licenses.map((c) => (
                          <li key={c.id}>
                            <span className="font-semibold">{c.title}</span>
                            {c.credential_number ? ` · ${c.credential_number}` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              )}
              {(p.insurance_info || p.warranty_info) && (
                <div className="mt-4 space-y-2 text-[13px] text-[#3a3a3c]">
                  {p.insurance_info ? (
                    <p>
                      <span className="font-semibold text-[#1d1d1f]">
                        {t('proProfile.insurance')}:
                      </span>{' '}
                      {p.insurance_info}
                    </p>
                  ) : null}
                  {p.warranty_info ? (
                    <p>
                      <span className="font-semibold text-[#1d1d1f]">
                        {t('proProfile.warranty')}:
                      </span>{' '}
                      {p.warranty_info}
                    </p>
                  ) : null}
                </div>
              )}
            </Section>

            <Section id="services" title={t('proProfile.services')}>
              {serviceGroups.length === 0 ? (
                <p className="text-[13px] text-[#6e6e73]">{t('proProfile.noServices')}</p>
              ) : (
                <div className="space-y-4">
                  {serviceGroups.map((group) => (
                    <div key={group.category}>
                      <p className="text-[12px] font-bold uppercase tracking-wide text-[#565959]">
                        {categoryLabel(group.category)}
                      </p>
                      <ul className="mt-2 space-y-2">
                        {group.items.map((s) => (
                          <li
                            key={s.id}
                            className="flex flex-wrap items-start justify-between gap-2 rounded-xl bg-[#fafafa] px-3 py-2"
                          >
                            <div>
                              <p className="text-[14px] font-semibold text-[#1d1d1f]">{s.name}</p>
                              {s.description ? (
                                <p className="mt-0.5 text-[12px] text-[#6e6e73]">{s.description}</p>
                              ) : null}
                            </div>
                            {formatPriceRange(s) ? (
                              <span className="text-[13px] font-semibold text-[var(--accent-700)]">
                                {formatPriceRange(s)}
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section id="portfolio" title={t('proProfile.portfolio')}>
              <PortfolioManager profileId={p.id} viewerId={user?.id ?? null} />
            </Section>

            <Section id="projects" title={t('proProfile.projectHistory')}>
              {bundle.projects.length === 0 ? (
                <p className="text-[13px] text-[#6e6e73]">{t('proProfile.noProjects')}</p>
              ) : (
                <ul className="space-y-3">
                  {bundle.projects.map((proj) => (
                    <li
                      key={proj.id}
                      className="overflow-hidden rounded-xl border border-[#e8e8ed]"
                    >
                      <div className="flex flex-col sm:flex-row">
                        {proj.image_url ? (
                          <img
                            src={proj.image_url}
                            alt=""
                            className="h-36 w-full object-cover sm:h-auto sm:w-40"
                            loading="lazy"
                          />
                        ) : null}
                        <div className="flex-1 p-3">
                          <p className="text-[14px] font-semibold text-[#1d1d1f]">{proj.title}</p>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-[#6e6e73]">
                            {proj.completed_at ? (
                              <span>{proj.completed_at}</span>
                            ) : null}
                            {proj.location ? <span>{proj.location}</span> : null}
                            {proj.category_slug ? (
                              <span>{categoryLabel(proj.category_slug)}</span>
                            ) : null}
                            {proj.duration_days != null ? (
                              <span>
                                {t('proProfile.durationDays').replace(
                                  '{n}',
                                  String(proj.duration_days),
                                )}
                              </span>
                            ) : null}
                            {proj.budget != null ? (
                              <span>
                                {proj.budget} {proj.currency}
                              </span>
                            ) : null}
                          </div>
                          {proj.description ? (
                            <p className="mt-2 text-[13px] text-[#3a3a3c]">{proj.description}</p>
                          ) : null}
                          {proj.customer_review ? (
                            <p className="mt-2 rounded-lg bg-[#fafafa] px-3 py-2 text-[13px] italic text-[#3a3a3c]">
                              “{proj.customer_review}”
                              {proj.customer_rating ? (
                                <span className="ml-2 not-italic font-semibold text-[#1d1d1f]">
                                  ★ {proj.customer_rating}
                                </span>
                              ) : null}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section id="reviews" title={t('proProfile.reviews')}>
              <ReviewFeed
                professionalId={p.id}
                viewerId={user?.id ?? null}
                viewerName={viewerProfile?.full_name || user?.email || null}
                showForm={Boolean(user && user.id !== p.id)}
                onSubmitted={() => void load()}
              />
            </Section>

            <Section id="area" title={t('proProfile.workingArea')}>
              {p.service_latitude != null && p.service_longitude != null ? (
                <WorkAreaMap
                  lat={p.service_latitude}
                  lng={p.service_longitude}
                  radiusKm={p.travel_radius_km ?? null}
                  name={p.full_name || 'Pro'}
                />
              ) : (
                <p className="text-[13px] text-[#6e6e73]">{t('proProfile.noMap')}</p>
              )}
              <div className="mt-3 space-y-1 text-[13px] text-[#3a3a3c]">
                {p.travel_radius_km != null ? (
                  <p>
                    {t('proProfile.travelRadius').replace('{n}', String(p.travel_radius_km))}
                  </p>
                ) : null}
                {(p.service_countries?.length || p.country_name) && (
                  <p>
                    <span className="font-semibold">{t('proProfile.countries')}:</span>{' '}
                    {(p.service_countries?.length
                      ? p.service_countries
                      : [p.country_name || p.country_code].filter(Boolean)
                    ).join(', ')}
                  </p>
                )}
                {(p.service_cities?.length || p.city) && (
                  <p>
                    <span className="font-semibold">{t('proProfile.cities')}:</span>{' '}
                    {(p.service_cities?.length ? p.service_cities : [p.city].filter(Boolean)).join(
                      ', ',
                    )}
                  </p>
                )}
              </div>
            </Section>

            <Section id="hours" title={t('proProfile.workingHours')}>
              <ul className="space-y-1 text-[13px] text-[#3a3a3c]">
                {formatWorkingHours(p.working_hours, t).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2 text-[12px] font-semibold">
                {p.emergency_available ? (
                  <span className="rounded-full bg-[#fff1f0] px-2.5 py-1 text-[#c41e3a]">
                    {t('proProfile.emergency')}
                  </span>
                ) : null}
                {p.weekend_available ? (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                    {t('proProfile.weekend')}
                  </span>
                ) : null}
              </div>
            </Section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <Section id="contact" title={t('proProfile.contact')}>
              <ul className="space-y-2 text-[13px] text-[#3a3a3c]">
                {p.phone ? (
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#86868b]" aria-hidden />
                    <a href={`tel:${p.phone}`} className="amazon-link">
                      {p.phone}
                    </a>
                  </li>
                ) : null}
                {p.email_public ? (
                  <li className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[#86868b]" aria-hidden />
                    <a href={`mailto:${p.email_public}`} className="amazon-link">
                      {p.email_public}
                    </a>
                  </li>
                ) : null}
                {p.website ? (
                  <li className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-[#86868b]" aria-hidden />
                    <a
                      href={p.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="amazon-link truncate"
                    >
                      {p.website.replace(/^https?:\/\//, '')}
                    </a>
                  </li>
                ) : null}
                {p.whatsapp ? (
                  <li>
                    <a
                      href={`https://wa.me/${p.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="amazon-link font-semibold"
                    >
                      WhatsApp
                    </a>
                  </li>
                ) : null}
                {p.telegram ? (
                  <li>
                    <a
                      href={
                        p.telegram.startsWith('http')
                          ? p.telegram
                          : `https://t.me/${p.telegram.replace(/^@/, '')}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="amazon-link font-semibold"
                    >
                      Telegram
                    </a>
                  </li>
                ) : null}
              </ul>
            </Section>

            {social.length > 0 ? (
              <section className="amazon-section-card" aria-labelledby="social-title">
                <h2 id="social-title" className="text-lg font-bold text-[var(--ink-900)]">
                  {t('proProfile.social')}
                </h2>
                <ul className="mt-3 space-y-2">
                  {social.map(([key, url]) => (
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

            {bundle.similar.length > 0 ? (
              <section className="amazon-section-card" aria-labelledby="similar-title">
                <h2 id="similar-title" className="text-lg font-bold text-[var(--ink-900)]">
                  {t('proProfile.similar')}
                </h2>
                <div className="mt-3 space-y-2">
                  {bundle.similar.map((pro) => (
                    <SimilarCard key={pro.id} pro={pro} />
                  ))}
                </div>
              </section>
            ) : null}

            <div className="amazon-section-card space-y-2">
              <button type="button" className="btn-primary w-full text-sm" onClick={requestQuote}>
                {t('proProfile.requestQuote')}
              </button>
              <button type="button" className="btn-secondary w-full text-sm" onClick={startChat}>
                {t('proProfile.chat')}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
