import { ArrowRight, MapPin, Star } from 'lucide-react'
import { Category, Profile } from '../lib/types'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'

interface ProfessionalCategoryLink {
  category_id: string
  category?: Category | null
}

interface ProfessionalCardData extends Profile {
  professional_categories?: ProfessionalCategoryLink[]
}

interface ProfessionalCardProps {
  professional: ProfessionalCardData
}

export function ProfessionalCard({ professional }: ProfessionalCardProps) {
  const { t } = useApp()

  const avatarUrl = professional.profile_photo || professional.avatar_url || null
  const ratingLabel =
    professional.rating > 0 ? professional.rating.toFixed(1) : t('professional.new')

  const translateUnsafe = (key: string) => {
    return t(key as never)
  }

  const skills = (professional.professional_categories || [])
    .map((item) => {
      const category = item.category

      if (!category) {
        return null
      }

      const newKey = `category.name.${category.slug}`
      const newValue = translateUnsafe(newKey)

      if (newValue !== newKey) {
        return newValue
      }

      const legacyKey = `category.${category.slug}`
      const legacyValue = translateUnsafe(legacyKey)

      if (legacyValue !== legacyKey) {
        return legacyValue
      }

      return category.name
    })
    .filter(Boolean)
    .slice(0, 3) as string[]

  return (
    <div className="glass-card flex h-full flex-col overflow-hidden p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={professional.full_name || t('professional.defaultName')}
            className="h-16 w-16 shrink-0 rounded-[22px] object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,rgba(255,244,234,0.95),rgba(244,186,134,0.72))] text-lg font-extrabold text-[#9a5525]">
            {getInitials(professional.full_name)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="truncate text-xl font-extrabold text-[#2f2a24]">
                {professional.full_name || t('professional.defaultName')}
              </h3>

              <div className="mt-2 flex items-center gap-2 text-sm text-[#7a7168]">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {professional.location || t('professional.global')}
                </span>
              </div>
            </div>

            <div className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[rgba(255,249,236,0.96)] px-3 py-1 text-sm font-bold text-[#8c6728]">
              <Star className="h-4 w-4 fill-current" />
              <span>{ratingLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {skills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={`${professional.id}-${skill}`}
              className="rounded-full bg-[rgba(242,171,116,0.16)] px-3 py-1 text-xs font-semibold text-[#9a5525]"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      <p className="mt-4 line-clamp-4 text-sm leading-6 text-[#6f665d]">
        {professional.bio || t('professional.profileInProgress')}
      </p>

      <div className="mt-5 flex flex-col gap-3 border-t border-[rgba(190,168,150,0.28)] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-[#7a7168]">
          {professional.total_reviews} {t('professional.reviews')}
        </div>

        <button
          onClick={() => navigateTo(`/professional/${professional.id}`)}
          type="button"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[rgba(242,171,116,0.18)] px-4 py-2 text-sm font-bold text-[#9a5525] transition hover:bg-[rgba(242,171,116,0.26)] sm:w-auto"
        >
          <span>{t('professional.contact')}</span>
          <ArrowRight className="h-4 w-4" />
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
