import { categorySlugForSubcategory, formatSubcategoriesSummary } from './categoryCatalog'
import type { Category, Profile } from './types'

type CategoryLink = {
  category_id: string
  category?: { id: string; name: string; slug: string } | null
}

export type ProfessionalDisplayProfile = Profile & {
  professional_categories?: CategoryLink[]
}

const PLACEHOLDER_BIO_MARKERS = [
  'profile is being completed',
  'profil',
  'наповнюється',
  'заполняется',
  'being completed',
  'in curs',
  'wird noch',
  'se pripravlja',
  'dorovn',
  '完善',
]

export function isGenericPlaceholderBio(bio: string | null | undefined): boolean {
  const text = bio?.trim().toLowerCase()
  if (!text) return true
  if (text.length < 12) return false
  return PLACEHOLDER_BIO_MARKERS.some((marker) => text.includes(marker))
}

export function resolveProfessionalDisplayName(
  professional: ProfessionalDisplayProfile,
  fallback: string,
): string {
  const name = professional.full_name?.trim()
  return name || fallback
}

/** Ім'я + прізвище або назва фірми — для карток у каталозі */
export function formatProfessionalCardTitle(
  professional: ProfessionalDisplayProfile,
  fallback: string,
): string {
  const name = resolveProfessionalDisplayName(professional, fallback)
  if (isCompanyProfile(professional)) {
    return name
  }
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length <= 2) return name
  return parts.slice(0, 3).join(' ')
}

export function isCompanyProfile(professional: ProfessionalDisplayProfile): boolean {
  return professional.user_role === 'company'
}

export function resolveProfessionalCategoryLabels(
  professional: ProfessionalDisplayProfile,
  translateCategory: (category: Category) => string,
  max = 3,
): string[] {
  return (professional.professional_categories || [])
    .map((item) => {
      const category = item.category
      if (!category) return null
      return translateCategory(category as Category)
    })
    .filter(Boolean)
    .slice(0, max) as string[]
}

export function resolveProfessionalActivityLine(
  professional: ProfessionalDisplayProfile,
  locale: string,
  translateCategory: (category: Category) => string,
  activityFallback: string,
  maxItems = 3,
): string {
  const categories = resolveProfessionalCategoryLabels(
    professional,
    translateCategory,
    maxItems,
  )

  const workSlugs = professional.work_subcategory_slugs ?? []
  const workCatSlug =
    workSlugs.length > 0
      ? categorySlugForSubcategory(workSlugs[0]) ?? 'construction'
      : null

  const workSummary =
    workCatSlug && workSlugs.length > 0
      ? formatSubcategoriesSummary(workCatSlug, workSlugs, locale, maxItems)
      : ''

  const parts = [...categories]
  if (workSummary) {
    const workParts = workSummary.split(',').map((s) => s.trim()).filter(Boolean)
    for (const part of workParts) {
      if (!parts.some((existing) => existing.toLowerCase() === part.toLowerCase())) {
        parts.push(part)
      }
    }
  }

  if (parts.length > 0) {
    return parts.slice(0, maxItems).join(' · ')
  }

  return activityFallback
}

/** 1–2 головні напрями для компактних карток (категорія + підвид робіт) */
export function resolvePrimaryActivityLabels(
  professional: ProfessionalDisplayProfile,
  locale: string,
  translateCategory: (category: Category) => string,
  max = 2,
): string[] {
  const categories = resolveProfessionalCategoryLabels(
    professional,
    translateCategory,
    max,
  )
  if (categories.length >= max) return categories

  const workSlugs = professional.work_subcategory_slugs ?? []
  const workCatSlug =
    workSlugs.length > 0
      ? categorySlugForSubcategory(workSlugs[0]) ?? 'construction'
      : null

  const workSummary =
    workCatSlug && workSlugs.length > 0
      ? formatSubcategoriesSummary(workCatSlug, workSlugs, locale, max)
      : ''

  const out = [...categories]
  if (workSummary) {
    for (const part of workSummary.split(',').map((s) => s.trim()).filter(Boolean)) {
      if (out.length >= max) break
      if (!out.some((existing) => existing.toLowerCase() === part.toLowerCase())) {
        out.push(part)
      }
    }
  }

  return out.slice(0, max)
}
