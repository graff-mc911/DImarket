import { categoryLabel, type BotLocale } from './i18n.ts'
import type { CategoryRow } from './flow.ts'

/** Як на сайті: src/lib/siteCategories.ts SITE_CATEGORY_CONFIG (SSoT). Mirror only — Deno edge cannot import Vite src. */
export const SITE_CATEGORY_SLUGS = [
  'cleaning',
  'construction',
  'electrical',
  'tools',
  'handyman',
  'furniture',
  'legal-notary',
  'accounting-finance',
  'vacancies',
  'sell-rent',
] as const

/** Keep in sync with SITE_CATEGORY_CONFIG icons in siteCategories.ts */
const SITE_ICONS: Record<string, string> = {
  cleaning: '🧹',
  construction: '🏗️',
  electrical: '🚗',
  tools: '🚚',
  handyman: '🛠️',
  furniture: '🪑',
  'legal-notary': '⚖️',
  'accounting-finance': '📊',
  vacancies: '💼',
  'sell-rent': '🛒',
}

/** Як на сайті: src/lib/homeFeaturedWorkTypes.ts HOME_FEATURED_WORK_GROUPS (SSoT). */
export const FEATURED_WORK_GROUPS = [
  { slug: 'hvac', icon: '🌡️', parentCategory: 'construction' },
  { slug: 'windows', icon: '🪟', parentCategory: 'construction' },
  { slug: 'design-engineering', icon: '📐', parentCategory: 'construction' },
  { slug: 'pools', icon: '🏊', parentCategory: 'construction' },
  { slug: 'solar', icon: '☀️', parentCategory: 'construction' },
  { slug: 'smart-home', icon: '🏡', parentCategory: 'construction' },
] as const

/** Усі slug підкатегорій групи (для listings.subcategory_slugs). */
export const WORK_GROUP_SUB_SLUGS: Record<string, string[]> = {
  hvac: ['hvac-ac', 'hvac-ventilation', 'hvac-recuperation', 'hvac-heat-pumps', 'hvac-heating', 'hvac-ac-cleaning'],
  windows: ['windows-install', 'windows-removal', 'windows-pvc', 'windows-aluminum', 'windows-wood', 'windows-adjustment', 'windows-repair', 'windows-glass-replacement'],
  'design-engineering': ['design-engineering-architect', 'design-engineering-structural', 'design-engineering-interior', 'design-engineering-3d', 'design-engineering-engineering'],
  pools: ['pools-construction', 'pools-repair', 'pools-maintenance'],
  solar: ['solar-panels', 'solar-inverters', 'solar-battery', 'solar-installation'],
  'smart-home': ['smart-home-systems', 'smart-home-automation', 'smart-home-lighting', 'smart-home-security'],
}

export type CategoryPick =
  | { kind: 'category'; row: CategoryRow }
  | { kind: 'work'; slug: string; icon: string; parentCategory: string; label: string }

export function workGroupLabel(slug: string, locale: BotLocale): string {
  const labels: Record<string, Partial<Record<BotLocale, string>>> = {
    hvac: { uk: 'HVAC / клімат', ru: 'HVAC / климат', en: 'HVAC / climate', pl: 'HVAC / klimat', es: 'HVAC / clima' },
    windows: { uk: 'Вікна', ru: 'Окна', en: 'Windows', pl: 'Okna', es: 'Ventanas' },
    'design-engineering': { uk: 'Проектування / інженерія', ru: 'Проектирование', en: 'Design / engineering', pl: 'Projekt' },
    pools: { uk: 'Басейни', ru: 'Бассейны', en: 'Pools', pl: 'Baseny', es: 'Piscinas', zh: '泳池' },
    solar: { uk: 'Сонячні системи', ru: 'Солнечные системы', en: 'Solar systems', pl: 'Systemy solarne', es: 'Sistemas solares', zh: '太阳能系统' },
    'smart-home': { uk: 'Розумний дім', ru: 'Умный дом', en: 'Smart home', pl: 'Inteligentny dom', es: 'Hogar inteligente', zh: '智能家居' },
  }
  return labels[slug]?.[locale] ?? labels[slug]?.en ?? slug
}

export function buildCategoryPicks(fromDb: CategoryRow[], locale: BotLocale): CategoryPick[] {
  const bySlug = new Map(fromDb.map((c) => [c.slug, c]))
  const picks: CategoryPick[] = []

  for (const slug of SITE_CATEGORY_SLUGS) {
    const row = bySlug.get(slug)
    if (row) {
      picks.push({ kind: 'category', row })
      continue
    }
    picks.push({
      kind: 'category',
      row: {
        id: `local-${slug}`,
        slug,
        name: categoryLabel(slug, locale, slug),
        icon: SITE_ICONS[slug] ?? '•',
      },
    })
  }

  for (const wg of FEATURED_WORK_GROUPS) {
    picks.push({
      kind: 'work',
      slug: wg.slug,
      icon: wg.icon,
      parentCategory: wg.parentCategory,
      label: workGroupLabel(wg.slug, locale),
    })
  }

  return picks
}

export function findPickByCallback(
  picks: CategoryPick[],
  data: string,
): CategoryPick | null {
  if (data.startsWith('cat:')) {
    const slug = data.slice(4)
    return picks.find((p) => p.kind === 'category' && p.row.slug === slug) ?? null
  }
  if (data.startsWith('work:')) {
    const slug = data.slice(5)
    return picks.find((p) => p.kind === 'work' && p.slug === slug) ?? null
  }
  return null
}

export function matchPickByText(
  text: string,
  picks: CategoryPick[],
  locale: BotLocale,
): CategoryPick | null {
  const lower = text.toLowerCase().trim()
  for (let i = 0; i < picks.length; i++) {
    const p = picks[i]
    const label =
      p.kind === 'category'
        ? categoryLabel(p.row.slug, locale, p.row.name).toLowerCase()
        : p.label.toLowerCase()
    const slug = p.kind === 'category' ? p.row.slug : p.slug
    if (lower.includes(slug) || lower.includes(label) || label.includes(lower)) return p
  }
  const num = lower.match(/^(\d{1,2})$/)
  if (num) {
    const idx = parseInt(num[1], 10) - 1
    if (picks[idx]) return picks[idx]
  }
  return null
}
