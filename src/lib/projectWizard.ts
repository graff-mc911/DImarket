import type { LucideIcon } from 'lucide-react'
import {
  Bath,
  BrickWall,
  DoorOpen,
  Droplets,
  Hammer,
  HardHat,
  Home,
  LayoutGrid,
  Paintbrush,
  PanelsTopLeft,
  Square,
  Zap,
} from 'lucide-react'

/** Trade cards for project wizard (construction-focused) */
export type ProjectTrade = {
  id: string
  subcategorySlug: string
  icon: LucideIcon
  labelKey: string
}

export const PROJECT_TRADES: ProjectTrade[] = [
  { id: 'painter', subcategorySlug: 'painting-interior', icon: Paintbrush, labelKey: 'project.trade.painter' },
  { id: 'drywall', subcategorySlug: 'drywall-install', icon: PanelsTopLeft, labelKey: 'project.trade.drywall' },
  { id: 'plaster', subcategorySlug: 'plastering-walls', icon: BrickWall, labelKey: 'project.trade.plaster' },
  { id: 'electrician', subcategorySlug: 'electro-wiring', icon: Zap, labelKey: 'project.trade.electrician' },
  { id: 'plumber', subcategorySlug: 'plumbing-pipes', icon: Droplets, labelKey: 'project.trade.plumber' },
  { id: 'tiles', subcategorySlug: 'tiling-floor', icon: LayoutGrid, labelKey: 'project.trade.tiles' },
  { id: 'roofing', subcategorySlug: 'roofing-install', icon: Home, labelKey: 'project.trade.roofing' },
  { id: 'facade', subcategorySlug: 'facade-cladding', icon: Square, labelKey: 'project.trade.facade' },
  { id: 'flooring', subcategorySlug: 'flooring-laminate', icon: PanelsTopLeft, labelKey: 'project.trade.flooring' },
  { id: 'windows', subcategorySlug: 'windows-install', icon: Square, labelKey: 'project.trade.windows' },
  { id: 'doors', subcategorySlug: 'carpentry-doors', icon: DoorOpen, labelKey: 'project.trade.doors' },
  { id: 'kitchen', subcategorySlug: 'carpentry-furniture', icon: Hammer, labelKey: 'project.trade.kitchen' },
  { id: 'bathroom', subcategorySlug: 'plumbing-bathroom', icon: Bath, labelKey: 'project.trade.bathroom' },
  { id: 'general', subcategorySlug: 'design-engineering-general', icon: HardHat, labelKey: 'project.trade.general' },
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
  budgetMin: 500,
  budgetMax: 5000,
  deadlineType: 'flexible',
  deadlineAt: '',
  urgency: 'normal',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  preferredLanguage: 'uk',
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
