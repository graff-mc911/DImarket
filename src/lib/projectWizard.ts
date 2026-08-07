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
}

/** Categories shown in Create Project wizard */
export const PROJECT_TRADES: ProjectTrade[] = [
  { id: 'painter', subcategorySlug: 'painting-interior', icon: Paintbrush, labelKey: 'project.trade.painter', labelEn: 'Painting' },
  { id: 'drywall', subcategorySlug: 'drywall-install', icon: PanelsTopLeft, labelKey: 'project.trade.drywall', labelEn: 'Drywall' },
  { id: 'electrician', subcategorySlug: 'electro-wiring', icon: Zap, labelKey: 'project.trade.electrician', labelEn: 'Electrical' },
  { id: 'plumber', subcategorySlug: 'plumbing-pipes', icon: Droplets, labelKey: 'project.trade.plumber', labelEn: 'Plumbing' },
  { id: 'roofing', subcategorySlug: 'roofing-install', icon: Home, labelKey: 'project.trade.roofing', labelEn: 'Roofing' },
  { id: 'flooring', subcategorySlug: 'flooring-laminate', icon: PanelsTopLeft, labelKey: 'project.trade.flooring', labelEn: 'Flooring' },
  { id: 'windows', subcategorySlug: 'windows-install', icon: Square, labelKey: 'project.trade.windows', labelEn: 'Windows' },
  { id: 'doors', subcategorySlug: 'carpentry-doors', icon: DoorOpen, labelKey: 'project.trade.doors', labelEn: 'Doors' },
  { id: 'facade', subcategorySlug: 'facade-cladding', icon: Square, labelKey: 'project.trade.facade', labelEn: 'Facade' },
  { id: 'kitchen', subcategorySlug: 'carpentry-furniture', icon: Hammer, labelKey: 'project.trade.kitchen', labelEn: 'Kitchen' },
  { id: 'bathroom', subcategorySlug: 'plumbing-bathroom', icon: Bath, labelKey: 'project.trade.bathroom', labelEn: 'Bathroom' },
  { id: 'general', subcategorySlug: 'design-engineering-general', icon: HardHat, labelKey: 'project.trade.general', labelEn: 'General Contractor' },
]

export type WizardDeadlineType = 'flexible' | 'asap' | 'date'
export type WizardUrgency = 'low' | 'normal' | 'high' | 'urgent'

export type WizardDraftFile = {
  file: File
  previewUrl: string
  kind: 'photo' | 'video' | 'pdf' | 'plan' | 'other'
}

export type ProjectWizardState = {
  step: number
  tradeId: string | null
  subcategorySlug: string | null
  description: string
  files: WizardDraftFile[]
  country: string
  city: string
  postalCode: string
  locationLabel: string
  latitude: number | null
  longitude: number | null
  budgetMin: number
  budgetMax: number
  deadlineType: WizardDeadlineType
  deadlineAt: string
  urgency: WizardUrgency
  contactName: string
  contactPhone: string
  contactEmail: string
  preferredLanguage: string
}

export const EMPTY_WIZARD_STATE: ProjectWizardState = {
  step: 1,
  tradeId: null,
  subcategorySlug: null,
  description: '',
  files: [],
  country: '',
  city: '',
  postalCode: '',
  locationLabel: '',
  latitude: null,
  longitude: null,
  budgetMin: 500,
  budgetMax: 5000,
  deadlineType: 'flexible',
  deadlineAt: '',
  urgency: 'normal',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  preferredLanguage: 'en',
}

export const WIZARD_STEP_COUNT = 7

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

export type WizardFieldErrors = Partial<Record<string, string>>

export function validateWizardStep(step: number, state: ProjectWizardState): WizardFieldErrors {
  const errors: WizardFieldErrors = {}
  switch (step) {
    case 1:
      if (!state.tradeId) errors.tradeId = 'Please choose a category'
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
      // Postal optional when city+country set (tender / estimator one-click path)
      break
    case 5:
      if (state.budgetMin < 0) errors.budgetMin = 'Invalid minimum'
      if (state.budgetMax <= 0) errors.budgetMax = 'Maximum budget is required'
      if (state.budgetMax < state.budgetMin) errors.budgetMax = 'Max must be ≥ min'
      break
    case 6:
      if (state.deadlineType === 'date' && !state.deadlineAt) {
        errors.deadlineAt = 'Please pick a date'
      }
      break
    case 7:
      if (!state.contactName.trim()) errors.contactName = 'Name is required'
      if (!state.contactEmail.trim() && !state.contactPhone.trim()) {
        errors.contact = 'Email or phone is required'
      }
      if (state.contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.contactEmail.trim())) {
        errors.contactEmail = 'Invalid email'
      }
      break
    default:
      break
  }
  return errors
}

export function isStepValid(step: number, state: ProjectWizardState): boolean {
  return Object.keys(validateWizardStep(step, state)).length === 0
}
