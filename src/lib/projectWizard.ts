import type { LucideIcon } from 'lucide-react'
import {
  Bath,
  DoorOpen,
  Droplets,
  Hammer,
  HardHat,
  Home,
  Paintbrush,
  PanelsTopLeft,
  Square,
  Zap,
} from 'lucide-react'

export type ProjectTrade = {
  id: string
  subcategorySlug: string
  icon: LucideIcon
  labelKey: string
  labelEn: string
  popular?: boolean
}

/** Categories shown in Create Project wizard */
export const PROJECT_TRADES: ProjectTrade[] = [
  { id: 'painter', subcategorySlug: 'painting-interior', icon: Paintbrush, labelKey: 'project.trade.painter', labelEn: 'Painting', popular: true },
  { id: 'drywall', subcategorySlug: 'drywall-install', icon: PanelsTopLeft, labelKey: 'project.trade.drywall', labelEn: 'Drywall' },
  { id: 'electrician', subcategorySlug: 'electro-wiring', icon: Zap, labelKey: 'project.trade.electrician', labelEn: 'Electrical', popular: true },
  { id: 'plumber', subcategorySlug: 'plumbing-pipes', icon: Droplets, labelKey: 'project.trade.plumber', labelEn: 'Plumbing', popular: true },
  { id: 'roofing', subcategorySlug: 'roofing-install', icon: Home, labelKey: 'project.trade.roofing', labelEn: 'Roofing', popular: true },
  { id: 'flooring', subcategorySlug: 'flooring-laminate', icon: PanelsTopLeft, labelKey: 'project.trade.flooring', labelEn: 'Flooring' },
  { id: 'windows', subcategorySlug: 'windows-install', icon: Square, labelKey: 'project.trade.windows', labelEn: 'Windows' },
  { id: 'doors', subcategorySlug: 'carpentry-doors', icon: DoorOpen, labelKey: 'project.trade.doors', labelEn: 'Doors' },
  { id: 'facade', subcategorySlug: 'facade-cladding', icon: Square, labelKey: 'project.trade.facade', labelEn: 'Facade' },
  { id: 'kitchen', subcategorySlug: 'carpentry-furniture', icon: Hammer, labelKey: 'project.trade.kitchen', labelEn: 'Kitchen', popular: true },
  { id: 'bathroom', subcategorySlug: 'plumbing-bathroom', icon: Bath, labelKey: 'project.trade.bathroom', labelEn: 'Bathroom', popular: true },
  { id: 'general', subcategorySlug: 'design-engineering-general', icon: HardHat, labelKey: 'project.trade.general', labelEn: 'General Contractor', popular: true },
]

export type WizardDeadlineType = 'flexible' | 'asap' | 'date' | 'this_week' | 'this_month'
export type WizardUrgency = 'low' | 'normal' | 'high' | 'urgent'
export type WizardBudgetBand =
  | 'under_500'
  | '500_2000'
  | '2000_10000'
  | '10000_plus'
  | 'custom'

export type WizardDraftFile = {
  file: File
  previewUrl: string
  kind: 'photo' | 'video' | 'pdf' | 'plan' | 'other'
}

export type WizardPreferences = {
  verifiedOnly: boolean
  companiesOnly: boolean
  emergency: boolean
  premiumOnly: boolean
  insuranceRequired: boolean
  warrantyRequired: boolean
}

export type ProjectWizardState = {
  step: number
  tradeId: string | null
  subcategorySlug: string | null
  categoryQuery: string
  description: string
  files: WizardDraftFile[]
  country: string
  city: string
  postalCode: string
  locationLabel: string
  latitude: number | null
  longitude: number | null
  budgetBand: WizardBudgetBand
  budgetMin: number
  budgetMax: number
  deadlineType: WizardDeadlineType
  deadlineAt: string
  urgency: WizardUrgency
  preferences: WizardPreferences
  contactName: string
  contactPhone: string
  contactEmail: string
  preferredLanguage: string
  draftId: string | null
  listingId: string | null
  publishedId: string | null
}

export const EMPTY_PREFERENCES: WizardPreferences = {
  verifiedOnly: false,
  companiesOnly: false,
  emergency: false,
  premiumOnly: false,
  insuranceRequired: false,
  warrantyRequired: false,
}

export const EMPTY_WIZARD_STATE: ProjectWizardState = {
  step: 1,
  tradeId: null,
  subcategorySlug: null,
  categoryQuery: '',
  description: '',
  files: [],
  country: '',
  city: '',
  postalCode: '',
  locationLabel: '',
  latitude: null,
  longitude: null,
  budgetBand: '500_2000',
  budgetMin: 500,
  budgetMax: 2000,
  deadlineType: 'flexible',
  deadlineAt: '',
  urgency: 'normal',
  preferences: { ...EMPTY_PREFERENCES },
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  preferredLanguage: 'en',
  draftId: null,
  listingId: null,
  publishedId: null,
}

export const WIZARD_STEP_COUNT = 9

export const WIZARD_STEP_LABELS = [
  'Service',
  'Details',
  'Files',
  'Location',
  'Budget',
  'Timeline',
  'Preferences',
  'Preview',
  'Publish',
] as const

export const BUDGET_BANDS: Array<{
  id: WizardBudgetBand
  label: string
  min: number
  max: number
}> = [
  { id: 'under_500', label: 'Under €500', min: 0, max: 500 },
  { id: '500_2000', label: '€500–€2,000', min: 500, max: 2000 },
  { id: '2000_10000', label: '€2,000–€10,000', min: 2000, max: 10000 },
  { id: '10000_plus', label: '€10,000+', min: 10000, max: 50000 },
  { id: 'custom', label: 'Custom budget', min: 500, max: 5000 },
]

export function applyBudgetBand(
  band: WizardBudgetBand,
  current: Pick<ProjectWizardState, 'budgetMin' | 'budgetMax'>,
): { budgetBand: WizardBudgetBand; budgetMin: number; budgetMax: number } {
  if (band === 'custom') {
    return {
      budgetBand: band,
      budgetMin: current.budgetMin || 500,
      budgetMax: current.budgetMax || 5000,
    }
  }
  const preset = BUDGET_BANDS.find((b) => b.id === band)!
  return { budgetBand: band, budgetMin: preset.min, budgetMax: preset.max }
}

export function fileKindFromMime(mime: string, name: string): WizardDraftFile['kind'] {
  if (mime.startsWith('image/')) return 'photo'
  if (mime.startsWith('video/')) return 'video'
  if (mime === 'application/pdf' || name.toLowerCase().endsWith('.pdf')) return 'pdf'
  if (/plan|dwg|dxf/i.test(name)) return 'plan'
  return 'other'
}

export function wizardTitleFromTrade(tradeLabel: string, city: string): string {
  const place = city.trim() ? ` — ${city.trim()}` : ''
  return `${tradeLabel}${place}`
}

export function mapDeadlineForDb(state: ProjectWizardState): {
  deadline_type: 'flexible' | 'asap' | 'date'
  deadline_at: string | null
  urgency: WizardUrgency
  timeline_option: WizardDeadlineType
} {
  const today = new Date()
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  if (state.deadlineType === 'asap') {
    return {
      deadline_type: 'asap',
      deadline_at: null,
      urgency: 'urgent',
      timeline_option: 'asap',
    }
  }
  if (state.deadlineType === 'this_week') {
    const d = new Date(today)
    d.setDate(d.getDate() + 7)
    return {
      deadline_type: 'date',
      deadline_at: iso(d),
      urgency: 'high',
      timeline_option: 'this_week',
    }
  }
  if (state.deadlineType === 'this_month') {
    const d = new Date(today)
    d.setDate(d.getDate() + 30)
    return {
      deadline_type: 'date',
      deadline_at: iso(d),
      urgency: 'normal',
      timeline_option: 'this_month',
    }
  }
  if (state.deadlineType === 'date') {
    return {
      deadline_type: 'date',
      deadline_at: state.deadlineAt || null,
      urgency: state.urgency,
      timeline_option: 'date',
    }
  }
  return {
    deadline_type: 'flexible',
    deadline_at: null,
    urgency: 'low',
    timeline_option: 'flexible',
  }
}

export type WizardFieldErrors = Partial<Record<string, string>>

export function validateWizardStep(step: number, state: ProjectWizardState): WizardFieldErrors {
  const errors: WizardFieldErrors = {}
  switch (step) {
    case 1:
      if (!state.tradeId) errors.tradeId = 'Please choose a service'
      break
    case 2:
      if (state.description.trim().length < 20) {
        errors.description = 'Please write at least 20 characters'
      }
      break
    case 3:
      break
    case 4:
      if (!state.country.trim()) errors.country = 'Country is required'
      if (!state.city.trim()) errors.city = 'City is required'
      if (!state.postalCode.trim()) errors.postalCode = 'Postal code is required'
      break
    case 5:
      if (state.budgetBand === 'custom') {
        if (state.budgetMin < 0) errors.budgetMin = 'Invalid minimum'
        if (state.budgetMax <= 0) errors.budgetMax = 'Maximum budget is required'
        if (state.budgetMax < state.budgetMin) errors.budgetMax = 'Max must be ≥ min'
      }
      break
    case 6:
      if (state.deadlineType === 'date' && !state.deadlineAt) {
        errors.deadlineAt = 'Please pick a date'
      }
      break
    case 7:
      break
    case 8:
      if (!state.contactName.trim()) errors.contactName = 'Name is required'
      if (!state.contactEmail.trim() && !state.contactPhone.trim()) {
        errors.contact = 'Email or phone is required'
      }
      if (
        state.contactEmail.trim() &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.contactEmail.trim())
      ) {
        errors.contactEmail = 'Invalid email'
      }
      break
    case 9:
      break
    default:
      break
  }
  return errors
}

export function isStepValid(step: number, state: ProjectWizardState): boolean {
  return Object.keys(validateWizardStep(step, state)).length === 0
}

/** Suggest trades from free text (lightweight AI suggestion). */
export function suggestTradesFromText(text: string, limit = 4): ProjectTrade[] {
  const q = text.toLowerCase()
  if (!q.trim()) return PROJECT_TRADES.filter((t) => t.popular).slice(0, limit)
  const scored = PROJECT_TRADES.map((t) => {
    let score = 0
    const label = t.labelEn.toLowerCase()
    if (q.includes(label) || label.includes(q)) score += 5
    const keywords: Record<string, string[]> = {
      painter: ['paint', 'wall', 'color', 'colour'],
      electrician: ['electric', 'wiring', 'socket', 'light', 'fuse'],
      plumber: ['plumb', 'pipe', 'leak', 'toilet', 'sink', 'water'],
      roofing: ['roof', 'tile', 'gutter'],
      kitchen: ['kitchen', 'cabinet', 'counter'],
      bathroom: ['bathroom', 'shower', 'bath', 'tile'],
      flooring: ['floor', 'laminate', 'parquet', 'vinyl'],
      windows: ['window', 'glazing'],
      doors: ['door'],
      drywall: ['drywall', 'gypsum', 'plaster'],
      facade: ['facade', 'façade', 'exterior'],
      general: ['renovation', 'remodel', 'builder', 'contractor'],
    }
    for (const kw of keywords[t.id] || []) {
      if (q.includes(kw)) score += 3
    }
    return { t, score }
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
  if (!scored.length) return PROJECT_TRADES.filter((t) => t.popular).slice(0, limit)
  return scored.slice(0, limit).map((x) => x.t)
}

export function serializeWizardState(state: ProjectWizardState): Record<string, unknown> {
  // Files can't be serialized — store metadata only
  return {
    step: state.step,
    tradeId: state.tradeId,
    subcategorySlug: state.subcategorySlug,
    categoryQuery: state.categoryQuery,
    description: state.description,
    fileMeta: state.files.map((f) => ({
      name: f.file.name,
      type: f.file.type,
      size: f.file.size,
      kind: f.kind,
    })),
    country: state.country,
    city: state.city,
    postalCode: state.postalCode,
    locationLabel: state.locationLabel,
    latitude: state.latitude,
    longitude: state.longitude,
    budgetBand: state.budgetBand,
    budgetMin: state.budgetMin,
    budgetMax: state.budgetMax,
    deadlineType: state.deadlineType,
    deadlineAt: state.deadlineAt,
    urgency: state.urgency,
    preferences: state.preferences,
    contactName: state.contactName,
    contactPhone: state.contactPhone,
    contactEmail: state.contactEmail,
    preferredLanguage: state.preferredLanguage,
    draftId: state.draftId,
    listingId: state.listingId,
  }
}

export function hydrateWizardState(
  raw: Record<string, unknown>,
  base: ProjectWizardState = EMPTY_WIZARD_STATE,
): ProjectWizardState {
  return {
    ...base,
    step: Number(raw.step) || 1,
    tradeId: (raw.tradeId as string | null) ?? null,
    subcategorySlug: (raw.subcategorySlug as string | null) ?? null,
    categoryQuery: String(raw.categoryQuery || ''),
    description: String(raw.description || ''),
    files: base.files,
    country: String(raw.country || ''),
    city: String(raw.city || ''),
    postalCode: String(raw.postalCode || ''),
    locationLabel: String(raw.locationLabel || ''),
    latitude: raw.latitude == null ? null : Number(raw.latitude),
    longitude: raw.longitude == null ? null : Number(raw.longitude),
    budgetBand: (raw.budgetBand as WizardBudgetBand) || '500_2000',
    budgetMin: Number(raw.budgetMin) || 500,
    budgetMax: Number(raw.budgetMax) || 2000,
    deadlineType: (raw.deadlineType as WizardDeadlineType) || 'flexible',
    deadlineAt: String(raw.deadlineAt || ''),
    urgency: (raw.urgency as WizardUrgency) || 'normal',
    preferences: {
      ...EMPTY_PREFERENCES,
      ...((raw.preferences as WizardPreferences) || {}),
    },
    contactName: String(raw.contactName || base.contactName),
    contactPhone: String(raw.contactPhone || base.contactPhone),
    contactEmail: String(raw.contactEmail || base.contactEmail),
    preferredLanguage: String(raw.preferredLanguage || base.preferredLanguage || 'en'),
    draftId: (raw.draftId as string | null) ?? null,
    listingId: (raw.listingId as string | null) ?? null,
    publishedId: null,
  }
}
