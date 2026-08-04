import { CheckSquare, Globe, Heart, MapPin, Phone, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Category, Profile } from '../lib/types'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import {
  categorySlugForSubcategory,
  getSubcategoryDef,
  labelFor,
} from '../lib/categoryCatalog'
import {
  formatProfessionalCardTitle,
  isCompanyProfile,
  resolveProfessionalCategoryLabels,
} from '../lib/professionalDisplay'
import { resolveDirectoryAvatarUrl } from '../lib/directoryAvatars'
import { supabase } from '../lib/supabase'
import { formatDistanceKm, formatLocationParts } from '../lib/geoSearch'

interface ProfessionalCategoryLink {
  category_id: string
  category?: Category | null
}

export type DirectoryExpert = Profile & {
  professional_categories?: ProfessionalCategoryLink[]
}

interface DirectoryExpertCardProps {
  professional: DirectoryExpert
  distanceKm?: number | null
}

type ServiceRow = { name: string; priceLabel: string }

function parseBioField(bio: string | null | undefined, label: string): string | null {
  if (!bio) return null
  const match = bio.match(new RegExp(`^${label}:\\s*(.+)$`, 'im'))
  return match?.[1]?.trim() || null
}

function parseServiceRowsFromBio(bio: string | null | undefined): ServiceRow[] {
  if (!bio) return []
  const match = bio.match(/Services:\s*([^\n]+)/i)
  if (!match) return []
  return match[1]
    .split(/[;|]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4)
    .map((raw) => {
      const priced =
        raw.match(/^(.*?)\s+[—–-]\s+(\d+(?:[.,]\d+)?\s*€(?:\/h)?)\s*$/i) ||
        raw.match(/^(.*?)\s+\((\d+(?:[.,]\d+)?\s*€(?:\/h)?)\)\s*$/i)
      if (priced) {
        return { name: priced[1].trim(), priceLabel: priced[2].replace(/\s+/g, ' ').trim() }
      }
      return { name: raw, priceLabel: '' }
    })
}

function buildServiceRows(
  professional: DirectoryExpert,
  locale: string,
  priceOnRequest: string,
): ServiceRow[] {
  const fromBio = parseServiceRowsFromBio(professional.bio)
  if (fromBio.length) {
    return fromBio.map((row) => ({
      name: row.name,
      priceLabel: row.priceLabel || priceOnRequest,
    }))
  }

  const slugs = professional.work_subcategory_slugs ?? []
  const rows: ServiceRow[] = []
  for (const slug of slugs.slice(0, 4)) {
    const parent = categorySlugForSubcategory(slug) || 'construction'
    const def = getSubcategoryDef(parent, slug)
    const name = def ? labelFor(def.label, locale, slug) : slug
    rows.push({ name, priceLabel: priceOnRequest })
  }
  return rows
}

function normalizeWebsiteHref(raw: string | null | undefined): string | null {
  const value = (raw ?? '').trim()
  if (!value) return null
  if (/^https?:\/\//i.test(value)) return value
  return `https://${value}`
}

function websiteDisplayLabel(raw: string): string {
  return raw.replace(/^https?:\/\//i, '').replace(/\/$/, '')
}

export function DirectoryExpertCard({ professional, distanceKm }: DirectoryExpertCardProps) {
  const { t, language, user } = useApp()
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const locParts = formatLocationParts(professional.location)
  const distanceLabel =
    distanceKm != null
      ? t('geo.distanceAway').replace('{distance}', formatDistanceKm(distanceKm))
      : null

  const displayName = formatProfessionalCardTitle(
    professional,
    t('professional.defaultName'),
  )
  const isCompany = isCompanyProfile(professional)
  const avatarUrl = resolveDirectoryAvatarUrl(
    professional.id,
    professional.profile_photo,
    professional.avatar_url,
  )
  const reviewsLabel =
    (professional.total_reviews ?? 0) > 0
      ? `${professional.rating?.toFixed?.(1) ?? professional.rating} · ${professional.total_reviews} ${t('professional.reviews')}`
      : t('professional.noReviews')

  const translateCategory = (category: Category) => {
    const newKey = `category.name.${category.slug}`
    const newValue = t(newKey as never)
    if (newValue !== newKey) return newValue
    const legacyKey = `category.${category.slug}`
    const legacyValue = t(legacyKey as never)
    if (legacyValue !== legacyKey) return legacyValue
    return category.name
  }

  const categoryLabels = resolveProfessionalCategoryLabels(
    professional,
    translateCategory,
    3,
  )

  if (categoryLabels.length === 0) {
    const slugs = professional.work_subcategory_slugs ?? []
    for (const slug of slugs.slice(0, 3)) {
      const parent = categorySlugForSubcategory(slug) || 'construction'
      const def = getSubcategoryDef(parent, slug)
      const name = def ? labelFor(def.label, language.code, slug) : slug
      if (!categoryLabels.includes(name)) categoryLabels.push(name)
    }
  }

  if (isCompany) {
    categoryLabels.unshift(t('professional.companyBadge'))
  }

  const serviceRows = buildServiceRows(
    professional,
    language.code,
    t('professional.priceOnRequest'),
  )

  const phone = (professional.phone ?? '').trim()
  const websiteHref = normalizeWebsiteHref(professional.website)
  const websiteLabel = websiteHref ? websiteDisplayLabel(websiteHref) : ''
  const showPublicContacts = isCompany && (Boolean(phone) || Boolean(websiteHref))

  const experienceRaw = parseBioField(professional.bio, 'Experience')
  const rateRaw = parseBioField(professional.bio, 'Rate')
  const tagsRaw = parseBioField(professional.bio, 'Tags')
  const extraTags = (tagsRaw || '')
    .split(/[;|]/)
    .map((s) => s.trim())
    .filter(Boolean)
  for (const tag of extraTags) {
    if (!categoryLabels.includes(tag)) categoryLabels.push(tag)
  }

  useEffect(() => {
    if (!user) {
      setSaved(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await supabase
          .from('saved_items')
          .select('id')
          .eq('user_id', user.id)
          .eq('item_type', 'profile')
          .eq('item_id', professional.id)
          .maybeSingle()
        if (!cancelled) setSaved(Boolean(data))
      } catch {
        if (!cancelled) setSaved(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user, professional.id])

  const toggleFavorite = async () => {
    if (!user) {
      navigateTo('/login')
      return
    }
    if (saving) return
    setSaving(true)
    try {
      if (saved) {
        await supabase
          .from('saved_items')
          .delete()
          .eq('user_id', user.id)
          .eq('item_type', 'profile')
          .eq('item_id', professional.id)
        setSaved(false)
      } else {
        await supabase.from('saved_items').insert({
          user_id: user.id,
          item_type: 'profile' as const,
          item_id: professional.id,
        } as never)
        setSaved(true)
      }
    } catch (error) {
      console.error('Favorite toggle failed:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <article className="directory-expert">
      <button
        type="button"
        className="directory-expert__photo"
        onClick={() => navigateTo(`/professional/${professional.id}`)}
        aria-label={displayName}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" loading="lazy" />
        ) : (
          <span className="directory-expert__photo-fallback" aria-hidden>
            {displayName.slice(0, 1).toUpperCase()}
          </span>
        )}
      </button>

      <div className="directory-expert__body">
        <div className="directory-expert__header">
          <div className="directory-expert__identity">
            <button
              type="button"
              className="directory-expert__name"
              onClick={() => navigateTo(`/professional/${professional.id}`)}
            >
              {displayName}
            </button>
            <div className="directory-expert__reviews">
              <Star className="directory-expert__star" aria-hidden />
              <span>{reviewsLabel}</span>
            </div>
            {(experienceRaw || rateRaw) && (
              <div className="directory-expert__stats">
                {experienceRaw ? <span>{experienceRaw}</span> : null}
                {experienceRaw && rateRaw ? <span aria-hidden>·</span> : null}
                {rateRaw ? <span>{rateRaw}</span> : null}
              </div>
            )}
            <div className="directory-expert__meta">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>
                {[locParts.city, locParts.region, locParts.country].filter(Boolean).join(', ') ||
                  professional.location ||
                  t('professional.global')}
                {distanceLabel ? ` · ${distanceLabel}` : ''}
              </span>
            </div>
            {showPublicContacts ? (
              <ul className="directory-expert__contacts">
                {phone ? (
                  <li>
                    <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <a href={`tel:${phone.replace(/\s+/g, '')}`}>{phone}</a>
                  </li>
                ) : null}
                {websiteHref ? (
                  <li>
                    <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <a
                      href={websiteHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={websiteHref}
                    >
                      {websiteLabel}
                    </a>
                  </li>
                ) : null}
              </ul>
            ) : null}
            {categoryLabels.length > 0 ? (
              <ul className="directory-expert__tags">
                {categoryLabels.map((label) => (
                  <li key={`${professional.id}-${label}`}>
                    <CheckSquare className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span>{label}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {serviceRows.length > 0 ? (
            <div className="directory-expert__prices">
              {serviceRows.map((row) => (
                <div key={`${professional.id}-${row.name}`} className="directory-expert__price-row">
                  <span className="directory-expert__price-name">{row.name}</span>
                  <span className="directory-expert__price-dots" aria-hidden />
                  <span className="directory-expert__price-value">{row.priceLabel}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="directory-expert__footer">
          <button
            type="button"
            className="directory-expert__profile-btn"
            onClick={() => navigateTo(`/professional/${professional.id}`)}
          >
            {t('professional.expertProfile')}
          </button>
          <button
            type="button"
            className={`directory-expert__fav ${saved ? 'is-saved' : ''}`}
            onClick={() => void toggleFavorite()}
            aria-label={t('favorites.title')}
            disabled={saving}
          >
            <Heart className={`h-5 w-5 ${saved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </article>
  )
}
