import { ArrowRight, Globe, MapPin, Phone, ShieldCheck, Star, UserRound, Zap } from 'lucide-react'
import { Category, Profile } from '../lib/types'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { VerificationBadge } from './MatchScoreBadge'
import {
  categorySlugForSubcategory,
  formatSubcategoriesSummary,
} from '../lib/categoryCatalog'
import {
  formatProfessionalCardTitle,
  isCompanyProfile,
  isGenericPlaceholderBio,
  resolvePrimaryActivityLabels,
  resolveProfessionalActivityLine,
} from '../lib/professionalDisplay'
import { resolveProfileAvatarUrl } from '../lib/directoryAvatars'

interface ProfessionalCategoryLink {
  category_id: string
  category?: Category | null
}

interface ProfessionalCardData extends Profile {
  professional_categories?: ProfessionalCategoryLink[]
}

interface ProfessionalCardProps {
  professional: ProfessionalCardData
  /** Компактний вигляд (~⅓ розміру стандартної картки) */
  compact?: boolean
  /** Значки verified / featured (головна) */
  showStatusBadges?: boolean
  /** Текст, якщо біо порожнє */
  emptyBioLabel?: string
}

export function ProfessionalCard({
  professional,
  compact = true,
  showStatusBadges = false,
  emptyBioLabel,
}: ProfessionalCardProps) {
  const { t, language } = useApp()

  const avatarUrl = resolveProfileAvatarUrl(professional)
  const ratingLabel =
    professional.rating > 0 ? professional.rating.toFixed(1) : t('professional.new')
  const isVerified = professional.is_verified === true
  const isFeatured = professional.is_featured === true

  const translateUnsafe = (key: string) => {
    return t(key as never)
  }

  const translateCategory = (category: Category) => {
    const newKey = `category.name.${category.slug}`
    const newValue = translateUnsafe(newKey)
    if (newValue !== newKey) return newValue

    const legacyKey = `category.${category.slug}`
    const legacyValue = translateUnsafe(legacyKey)
    if (legacyValue !== legacyKey) return legacyValue

    return category.name
  }

  const skills = (professional.professional_categories || [])
    .map((item) => {
      const category = item.category
      if (!category) return null
      return translateCategory(category)
    })
    .filter(Boolean)
    .slice(0, compact ? 2 : 3) as string[]

  const displayName = formatProfessionalCardTitle(
    professional,
    t('professional.defaultName'),
  )
  const isCompany = isCompanyProfile(professional)
  const primaryActivities = resolvePrimaryActivityLabels(
    professional,
    language.code,
    translateCategory,
    compact ? 2 : 3,
  )
  const rawActivityLine = resolveProfessionalActivityLine(
    professional,
    language.code,
    translateCategory,
    '',
    compact ? 2 : 4,
  )
  const hasSpecifiedActivity = primaryActivities.length > 0 || Boolean(rawActivityLine)
  const activityLine =
    primaryActivities.length > 0
      ? primaryActivities.join(' · ')
      : rawActivityLine || t('professional.activityNotSpecified')
  const showCompactBio =
    compact &&
    !hasSpecifiedActivity &&
    Boolean(professional.bio?.trim()) &&
    !isGenericPlaceholderBio(professional.bio)

  const workSlugs = professional.work_subcategory_slugs ?? []
  const workCatSlug =
    workSlugs.length > 0 ?
      categorySlugForSubcategory(workSlugs[0]) ?? 'construction'
    : 'construction'
  const workTypesSummary = formatSubcategoriesSummary(
    workCatSlug,
    workSlugs,
    language.code,
    compact ? 2 : 4,
  )

  const phone = (professional.phone ?? '').trim()
  const websiteRaw = (professional.website ?? '').trim()
  const websiteHref = websiteRaw
    ? /^https?:\/\//i.test(websiteRaw)
      ? websiteRaw
      : `https://${websiteRaw}`
    : null
  const websiteLabel = websiteHref
    ? websiteHref.replace(/^https?:\/\//i, '').replace(/\/$/, '')
    : ''
  const showPublicContacts = Boolean(phone) || Boolean(websiteHref)

  const rootClass = compact
    ? 'glass-card card-hover-lift pro-card--compact flex h-full min-w-0 flex-col overflow-hidden'
    : 'glass-card flex h-full flex-col overflow-hidden p-5'

  const avatarClass = compact
    ? 'pro-card__avatar shrink-0 rounded-[0.5rem] object-cover'
    : 'h-16 w-16 shrink-0 rounded-[22px] object-cover'

  const avatarFallbackClass = compact
    ? 'pro-card__avatar flex shrink-0 items-center justify-center rounded-[0.5rem] border border-[var(--glass-border)] bg-[rgba(255,248,241,0.42)] font-bold text-[var(--accent-700)]'
    : 'flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,rgba(255,244,234,0.95),rgba(244,186,134,0.72))] text-lg font-extrabold text-[#9a5525]'

  return (
    <div className={rootClass}>
      <div
        className={
          compact
            ? 'pro-card__header flex items-start justify-between'
            : 'flex flex-col gap-4 sm:flex-row sm:items-start'
        }
      >
        <div
          className={
            compact ? 'pro-card__identity flex min-w-0 items-center' : 'flex items-center gap-3'
          }
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className={avatarClass}
            />
          ) : (
            <div className={avatarFallbackClass}>{getInitials(displayName)}</div>
          )}

          <div className="min-w-0 flex-1">
            <div
              className={
                compact
                  ? 'flex min-w-0 items-center gap-1'
                  : 'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'
              }
            >
              <div className="min-w-0">
                <div className="flex min-w-0 items-start gap-1">
                  <div className="min-w-0 flex-1">
                    {isCompany && (
                      <span className="pro-card__role-badge mb-0.5 inline-block rounded-full bg-[rgba(169,105,66,0.12)] px-1.5 py-px text-[0.5625rem] font-bold uppercase tracking-wide text-[var(--accent-700)]">
                        {t('professional.companyBadge')}
                      </span>
                    )}
                    <h3
                      className={
                        compact
                          ? 'pro-card__name font-bold text-[var(--ink-900)]'
                          : 'truncate text-xl font-extrabold text-[#2f2a24]'
                      }
                      title={displayName}
                    >
                      {displayName}
                    </h3>
                    {compact && (
                      <p className="pro-card__activity-label mt-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-[var(--ink-500)]">
                        {t('professional.activityLabel')}
                      </p>
                    )}
                    {!(compact && primaryActivities.length > 0) && (
                      <p
                        className={
                          compact
                            ? `pro-card__activity font-semibold ${
                                hasSpecifiedActivity
                                  ? 'text-[var(--accent-700)]'
                                  : 'text-[var(--ink-500)] italic'
                              }`
                            : `mt-1 text-sm font-semibold leading-snug ${
                                hasSpecifiedActivity
                                  ? 'text-[var(--accent-700)]'
                                  : 'text-[var(--ink-500)]'
                              }`
                        }
                        title={activityLine}
                      >
                        {hasSpecifiedActivity
                          ? activityLine
                          : t('professional.activityNotSpecified')}
                      </p>
                    )}
                    {compact && primaryActivities.length > 0 && (
                      <div className="pro-card__tags mt-1 flex flex-wrap gap-1">
                        {primaryActivities.map((label) => (
                          <span
                            key={`${professional.id}-${label}`}
                            className="pro-card__chip rounded-full bg-[rgba(169,105,66,0.12)] font-semibold text-[var(--accent-700)]"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {showStatusBadges && (
                    <div className="flex shrink-0 items-center gap-1">
                      <VerificationBadge level={professional.verification_level} />
                      {isVerified && (
                        <ShieldCheck
                          className="pro-card__verified shrink-0 text-[#15803d]"
                          aria-label={t('professional.verified')}
                        />
                      )}
                    </div>
                  )}
                  {!showStatusBadges && professional.verification_level && professional.verification_level !== 'none' && (
                    <VerificationBadge level={professional.verification_level} />
                  )}
                </div>

                <div
                  className={
                    compact
                      ? 'pro-card__meta mt-0.5 flex items-center gap-1 text-[var(--ink-500)]'
                      : 'mt-2 flex items-center gap-2 text-sm text-[#7a7168]'
                  }
                >
                  <MapPin className="pro-card__avatar-icon shrink-0 text-[var(--accent-700)]" />
                  <span className="truncate">
                    {professional.location || t('professional.global')}
                  </span>
                </div>
                {showPublicContacts ? (
                  <div
                    className={
                      compact
                        ? 'pro-card__contacts mt-1 grid gap-0.5 text-[0.7rem]'
                        : 'mt-2 grid gap-1 text-sm'
                    }
                  >
                    {phone ? (
                      <a
                        href={`tel:${phone.replace(/\s+/g, '')}`}
                        className="inline-flex min-w-0 items-center gap-1 font-semibold text-[var(--accent-700)] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        <span className="truncate">{phone}</span>
                      </a>
                    ) : null}
                    {websiteHref ? (
                      <a
                        href={websiteHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-w-0 items-center gap-1 font-semibold text-[var(--accent-700)] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        <span className="truncate">{websiteLabel}</span>
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {!compact && (
                <div className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[rgba(255,249,236,0.96)] px-3 py-1 text-sm font-bold text-[#8c6728]">
                  <Star className="h-4 w-4 fill-current" />
                  <span>{ratingLabel}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {compact && (
          <div className="pro-card__rating inline-flex shrink-0 items-center gap-0.5 rounded-full border border-[var(--glass-border)] bg-[rgba(255,252,248,0.38)] font-semibold text-[#8c6728]">
            <Star className="pro-card__avatar-icon fill-current" />
            <span>{ratingLabel}</span>
          </div>
        )}
      </div>

      {showStatusBadges && isFeatured && (
        <div
          className="pro-card__featured inline-flex items-center gap-0.5 rounded-full font-bold"
          style={{
            background: 'rgba(99,102,241,0.12)',
            color: '#6366f1',
          }}
        >
          <Zap className="pro-card__avatar-icon" />
          {t('professional.featured')}
        </div>
      )}

      {!compact && (skills.length > 0 || workTypesSummary) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={`${professional.id}-${skill}`}
              className="rounded-full bg-[rgba(242,171,116,0.16)] px-3 py-1 text-xs font-semibold text-[#9a5525]"
            >
              {skill}
            </span>
          ))}
          {workTypesSummary && (
            <span className="rounded-full bg-[rgba(99,102,241,0.12)] px-3 py-1 text-xs font-semibold text-[#4338ca]">
              {workTypesSummary}
            </span>
          )}
        </div>
      )}

      {compact && showCompactBio && (
        <p className="pro-card__bio muted-text line-clamp-2">{professional.bio}</p>
      )}

      {!compact && (
        <p className="mt-4 line-clamp-4 text-sm leading-6 text-[#6f665d]">
          {professional.bio ||
            emptyBioLabel ||
            t('professional.profileInProgress')}
        </p>
      )}

      <div
        className={
          compact
            ? 'pro-card__footer mt-auto flex flex-col border-t border-[var(--glass-border)] sm:flex-row sm:items-center sm:justify-between'
            : 'mt-5 flex flex-col gap-3 border-t border-[rgba(190,168,150,0.28)] pt-4 sm:flex-row sm:items-center sm:justify-between'
        }
      >
        <div
          className={
            compact
              ? 'pro-card__footer-text flex items-center gap-1 text-[var(--ink-500)]'
              : 'text-sm text-[#7a7168]'
          }
        >
          {compact && <UserRound className="pro-card__avatar-icon text-[var(--accent-700)]" />}
          <span>
            {professional.total_reviews} {t('professional.reviews')}
          </span>
        </div>

        <button
          onClick={() => navigateTo(`/professional/${professional.id}`)}
          type="button"
          className={
            compact
              ? 'pro-card__action inline-flex items-center gap-1 font-semibold text-[var(--accent-700)] transition hover:text-[var(--ink-900)]'
              : 'pro-card__action-btn inline-flex w-full items-center justify-center gap-2 rounded-full bg-[rgba(242,171,116,0.18)] px-4 py-2 text-sm font-bold text-[#9a5525] transition hover:bg-[rgba(242,171,116,0.26)] sm:w-auto'
          }
        >
          <span>{t('professional.contact')}</span>
          <ArrowRight className="pro-card__avatar-icon" />
        </button>
      </div>
    </div>
  )
}

function getInitials(fullName: string | null) {
  if (!fullName) {
    return 'DM'
  }

  const parts = fullName.trim().split(/\s+/).slice(0, 2)
  return parts.map((part) => part[0]?.toUpperCase() || '').join('') || 'DM'
}
