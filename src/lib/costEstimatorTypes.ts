/**
 * AI Cost Estimator — project types, state, and analysis shapes.
 * Prices are reference ranges (ориєнтовна оцінка), not live market quotes.
 */
import type { LucideIcon } from 'lucide-react'
import {
  Bath,
  BedDouble,
  Building2,
  DoorOpen,
  Droplets,
  Fence,
  Hammer,
  HardHat,
  Home,
  LayoutGrid,
  Leaf,
  Paintbrush,
  PanelsTopLeft,
  Sofa,
  Square,
  Sun,
  Warehouse,
  Waves,
  Wind,
  Wrench,
  Zap,
} from 'lucide-react'

export const ESTIMATOR_STEP_COUNT = 6

export type EstimatorStep =
  | 1 // Project type
  | 2 // Description
  | 3 // Files
  | 4 // Location
  | 5 // Measurements
  | 6 // Results (analysis + estimate + specialists + materials + quotes)

export type EstimatorProjectTypeId =
  | 'renovation'
  | 'house_renovation'
  | 'new_construction'
  | 'bathroom'
  | 'kitchen'
  | 'living_room'
  | 'bedroom'
  | 'office'
  | 'commercial'
  | 'warehouse'
  | 'roof'
  | 'facade'
  | 'electrical'
  | 'plumbing'
  | 'hvac'
  | 'drywall'
  | 'painting'
  | 'flooring'
  | 'tiling'
  | 'windows'
  | 'doors'
  | 'landscaping'
  | 'pool'
  | 'solar'
  | 'other'

export type EstimatorProjectType = {
  id: EstimatorProjectTypeId
  icon: LucideIcon
  labelKey: string
  labelEn: string
  /** Maps to PROJECT_TRADES / subcategory for matching */
  tradeId: string
  subcategorySlug: string
  /** Baseline EUR/m² mid rate (labor+materials) */
  perSqm: number
  laborShare: number
  daysPer10Sqm: number
}

export const ESTIMATOR_PROJECT_TYPES: EstimatorProjectType[] = [
  { id: 'renovation', icon: Hammer, labelKey: 'costEstimator.type.renovation', labelEn: 'Apartment renovation', tradeId: 'general', subcategorySlug: 'design-engineering-general', perSqm: 95, laborShare: 0.5, daysPer10Sqm: 2.8 },
  { id: 'house_renovation', icon: Home, labelKey: 'costEstimator.type.houseRenovation', labelEn: 'House renovation', tradeId: 'general', subcategorySlug: 'design-engineering-general', perSqm: 105, laborShare: 0.5, daysPer10Sqm: 3.0 },
  { id: 'new_construction', icon: HardHat, labelKey: 'costEstimator.type.newConstruction', labelEn: 'New Construction', tradeId: 'general', subcategorySlug: 'design-engineering-general', perSqm: 140, laborShare: 0.45, daysPer10Sqm: 4.0 },
  { id: 'bathroom', icon: Bath, labelKey: 'costEstimator.type.bathroom', labelEn: 'Bathroom', tradeId: 'bathroom', subcategorySlug: 'plumbing-bathroom', perSqm: 280, laborShare: 0.45, daysPer10Sqm: 3.2 },
  { id: 'kitchen', icon: LayoutGrid, labelKey: 'costEstimator.type.kitchen', labelEn: 'Kitchen', tradeId: 'kitchen', subcategorySlug: 'carpentry-furniture', perSqm: 320, laborShare: 0.4, daysPer10Sqm: 3.5 },
  { id: 'living_room', icon: Sofa, labelKey: 'costEstimator.type.livingRoom', labelEn: 'Living Room', tradeId: 'painter', subcategorySlug: 'painting-interior', perSqm: 75, laborShare: 0.55, daysPer10Sqm: 2.0 },
  { id: 'bedroom', icon: BedDouble, labelKey: 'costEstimator.type.bedroom', labelEn: 'Bedroom', tradeId: 'painter', subcategorySlug: 'painting-interior', perSqm: 65, laborShare: 0.55, daysPer10Sqm: 1.8 },
  { id: 'office', icon: Building2, labelKey: 'costEstimator.type.office', labelEn: 'Office', tradeId: 'general', subcategorySlug: 'design-engineering-general', perSqm: 90, laborShare: 0.5, daysPer10Sqm: 2.2 },
  { id: 'commercial', icon: Building2, labelKey: 'costEstimator.type.commercial', labelEn: 'Commercial Property', tradeId: 'general', subcategorySlug: 'design-engineering-general', perSqm: 110, laborShare: 0.48, daysPer10Sqm: 2.6 },
  { id: 'warehouse', icon: Warehouse, labelKey: 'costEstimator.type.warehouse', labelEn: 'Warehouse', tradeId: 'general', subcategorySlug: 'design-engineering-general', perSqm: 55, laborShare: 0.5, daysPer10Sqm: 1.5 },
  { id: 'roof', icon: Home, labelKey: 'costEstimator.type.roof', labelEn: 'Roof', tradeId: 'roofing', subcategorySlug: 'roofing-install', perSqm: 95, laborShare: 0.5, daysPer10Sqm: 2.2 },
  { id: 'facade', icon: Fence, labelKey: 'costEstimator.type.facade', labelEn: 'Facade', tradeId: 'facade', subcategorySlug: 'facade-cladding', perSqm: 85, laborShare: 0.5, daysPer10Sqm: 2.5 },
  { id: 'electrical', icon: Zap, labelKey: 'costEstimator.type.electrical', labelEn: 'Electrical', tradeId: 'electrician', subcategorySlug: 'electro-wiring', perSqm: 45, laborShare: 0.7, daysPer10Sqm: 1.5 },
  { id: 'plumbing', icon: Droplets, labelKey: 'costEstimator.type.plumbing', labelEn: 'Plumbing', tradeId: 'plumber', subcategorySlug: 'plumbing-pipes', perSqm: 50, laborShare: 0.6, daysPer10Sqm: 1.6 },
  { id: 'hvac', icon: Wind, labelKey: 'costEstimator.type.hvac', labelEn: 'HVAC', tradeId: 'general', subcategorySlug: 'hvac-install', perSqm: 70, laborShare: 0.55, daysPer10Sqm: 1.8 },
  { id: 'drywall', icon: PanelsTopLeft, labelKey: 'costEstimator.type.drywall', labelEn: 'Drywall', tradeId: 'drywall', subcategorySlug: 'drywall-install', perSqm: 55, laborShare: 0.55, daysPer10Sqm: 1.8 },
  { id: 'painting', icon: Paintbrush, labelKey: 'costEstimator.type.painting', labelEn: 'Painting', tradeId: 'painter', subcategorySlug: 'painting-interior', perSqm: 28, laborShare: 0.65, daysPer10Sqm: 1.2 },
  { id: 'flooring', icon: Square, labelKey: 'costEstimator.type.flooring', labelEn: 'Flooring', tradeId: 'flooring', subcategorySlug: 'flooring-laminate', perSqm: 48, laborShare: 0.45, daysPer10Sqm: 1.4 },
  { id: 'tiling', icon: LayoutGrid, labelKey: 'costEstimator.type.tiling', labelEn: 'Tiling', tradeId: 'flooring', subcategorySlug: 'tiling-bathroom', perSqm: 65, laborShare: 0.5, daysPer10Sqm: 1.6 },
  { id: 'windows', icon: Square, labelKey: 'costEstimator.type.windows', labelEn: 'Windows', tradeId: 'windows', subcategorySlug: 'windows-install', perSqm: 180, laborShare: 0.35, daysPer10Sqm: 0.8 },
  { id: 'doors', icon: DoorOpen, labelKey: 'costEstimator.type.doors', labelEn: 'Doors', tradeId: 'doors', subcategorySlug: 'carpentry-doors', perSqm: 160, laborShare: 0.4, daysPer10Sqm: 0.6 },
  { id: 'landscaping', icon: Leaf, labelKey: 'costEstimator.type.landscaping', labelEn: 'Landscaping', tradeId: 'general', subcategorySlug: 'garden-landscaping', perSqm: 35, laborShare: 0.55, daysPer10Sqm: 1.2 },
  { id: 'pool', icon: Waves, labelKey: 'costEstimator.type.pool', labelEn: 'Swimming Pool', tradeId: 'general', subcategorySlug: 'pool-install', perSqm: 450, laborShare: 0.4, daysPer10Sqm: 5.0 },
  { id: 'solar', icon: Sun, labelKey: 'costEstimator.type.solar', labelEn: 'Solar Installation', tradeId: 'electrician', subcategorySlug: 'electro-solar', perSqm: 220, laborShare: 0.35, daysPer10Sqm: 1.0 },
  { id: 'other', icon: Wrench, labelKey: 'costEstimator.type.other', labelEn: 'Other', tradeId: 'general', subcategorySlug: 'design-engineering-general', perSqm: 70, laborShare: 0.55, daysPer10Sqm: 2.0 },
]

export type EstimatorDraftFile = {
  id: string
  file: File
  previewUrl: string
  kind: 'photo' | 'video' | 'pdf' | 'cad' | 'other'
}

export type EstimatorMeasurements = {
  areaSqm: number
  lengthM: number | null
  widthM: number | null
  heightM: number | null
  rooms: number | null
  floors: number | null
}

export type EstimatorLocation = {
  country: string
  region: string
  province: string
  city: string
  postalCode: string
  locationLabel: string
  latitude: number | null
  longitude: number | null
}

export type EstimatorState = {
  step: EstimatorStep
  projectTypeId: EstimatorProjectTypeId | null
  description: string
  files: EstimatorDraftFile[]
  location: EstimatorLocation
  measurements: EstimatorMeasurements
  /** AI Analyst clarifying answers (field → text) */
  clarifications: Record<string, string>
}

export const EMPTY_ESTIMATOR_LOCATION: EstimatorLocation = {
  country: '',
  region: '',
  province: '',
  city: '',
  postalCode: '',
  locationLabel: '',
  latitude: null,
  longitude: null,
}

export const EMPTY_ESTIMATOR_STATE: EstimatorState = {
  step: 1,
  projectTypeId: null,
  description: '',
  files: [],
  location: { ...EMPTY_ESTIMATOR_LOCATION },
  measurements: {
    areaSqm: 20,
    lengthM: null,
    widthM: null,
    heightM: null,
    rooms: null,
    floors: 1,
  },
  clarifications: {},
}

export type CostBreakdownLine = {
  id: string
  category:
    | 'labor'
    | 'materials'
    | 'equipment'
    | 'transport'
    | 'waste'
    | 'permits'
    | 'contingency'
    | 'taxes'
  label: string
  amountEconomy: number
  amountStandard: number
  amountPremium: number
}

export type WorkStage = {
  id: string
  label: string
  tradeId: string
  laborHours: number
  order: number
}

export type MaterialLine = {
  id: string
  name: string
  quantity: number
  unit: string
  category: string
  unitPriceEconomy: number
  unitPriceStandard: number
  unitPricePremium: number
  searchQuery: string
}

export type TimelinePhase = {
  id: string
  label: string
  daysMin: number
  daysMax: number
}

export type SpecialistNeed = {
  id: string
  tradeId: string
  label: string
  subcategorySlug: string
  laborHours: number
}

export type AiInsight = {
  id: string
  kind: 'saving' | 'upgrade' | 'risk' | 'sequence' | 'missing' | 'mistake'
  text: string
}

export type PricingTierId = 'economy' | 'standard' | 'premium'

export type FullCostEstimate = {
  projectTypeId: EstimatorProjectTypeId
  tradeLabel: string
  currency: string
  isReferenceEstimate: true
  disclaimer: string
  confidence: number
  source: 'ai' | 'local' | 'blended'
  explanation: string
  factors: string[]
  workStages: WorkStage[]
  specialists: SpecialistNeed[]
  materials: MaterialLine[]
  breakdown: CostBreakdownLine[]
  timeline: TimelinePhase[]
  totalDaysMin: number
  totalDaysMax: number
  estimatedCompletionIso: string
  totals: Record<
    PricingTierId,
    {
      labor: number
      materials: number
      equipment: number
      transport: number
      waste: number
      permits: number
      contingency: number
      taxes: number
      grandTotal: number
    }
  >
  insights: AiInsight[]
  laborHoursTotal: number
}

export function getProjectType(id: EstimatorProjectTypeId | null | undefined) {
  return ESTIMATOR_PROJECT_TYPES.find((t) => t.id === id) || ESTIMATOR_PROJECT_TYPES.find((t) => t.id === 'other')!
}

export function fileKindFromMime(mime: string, name: string): EstimatorDraftFile['kind'] {
  if (mime.startsWith('image/')) return 'photo'
  if (mime.startsWith('video/')) return 'video'
  if (mime === 'application/pdf' || name.toLowerCase().endsWith('.pdf')) return 'pdf'
  if (/\.(dwg|dxf|skp|ifc)$/i.test(name)) return 'cad'
  return 'other'
}
