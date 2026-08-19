import type { EstimatorObjectTypeId, EstimatorProjectTypeId, EstimatorWorkPackage } from './costEstimatorTypes'

/** What is being built or renovated — not a trade. */
export type EstimatorObjectType = {
  id: EstimatorObjectTypeId
  labelEn: string
  labelUk: string
  /** Engine / matching type (existing specialist templates). */
  engineType: EstimatorProjectTypeId
  /** Baseline EUR/m² for this object before work options. */
  perSqm: number
  /** Typical construction sequence for this object. */
  recommendedWorks: string[]
}

/** Site work order when building an object (earth → structure → envelope → MEP → finish). */
export const CONSTRUCTION_WORK_ORDER = [
  'design-engineering',
  'demolition',
  'earthworks',
  'foundation',
  'concrete',
  'masonry',
  'welding',
  'metal',
  'roofing',
  'facade',
  'windows',
  'doors',
  'plumbing',
  'electro',
  'hvac',
  'insulation',
  'drywall',
  'plastering',
  'flooring',
  'tiling',
  'carpentry',
  'painting',
  'wallpaper',
  'bathroom',
  'kitchen',
  'glass',
  'landscaping',
  'pools',
  'solar',
  'smart-home',
] as const

const WORK_LABELS: Record<string, { en: string; uk: string }> = {
  'design-engineering': { en: 'Design & engineering', uk: 'Проєктування' },
  demolition: { en: 'Demolition', uk: 'Демонтаж' },
  earthworks: { en: 'Earthworks', uk: 'Земляні роботи' },
  foundation: { en: 'Foundations', uk: 'Фундамент' },
  concrete: { en: 'Concrete works', uk: 'Бетонні роботи' },
  masonry: { en: 'Masonry', uk: 'Мурувальні роботи' },
  welding: { en: 'Welding', uk: 'Зварювання' },
  metal: { en: 'Steel / metal structure', uk: 'Металоконструкції' },
  roofing: { en: 'Roofing', uk: 'Покрівельні роботи' },
  facade: { en: 'Facade', uk: 'Фасад' },
  windows: { en: 'Windows', uk: 'Вікна' },
  doors: { en: 'Doors', uk: 'Двері' },
  plumbing: { en: 'Plumbing', uk: 'Сантехнічні роботи' },
  electro: { en: 'Electrical', uk: 'Електромонтаж' },
  hvac: { en: 'HVAC', uk: 'Опалення та клімат' },
  insulation: { en: 'Insulation', uk: 'Утеплення' },
  drywall: { en: 'Drywall', uk: 'Гіпсокартон' },
  plastering: { en: 'Plastering', uk: 'Штукатурні роботи' },
  flooring: { en: 'Flooring', uk: 'Підлога' },
  tiling: { en: 'Tiling', uk: 'Плиткові роботи' },
  carpentry: { en: 'Carpentry', uk: 'Столярні роботи' },
  painting: { en: 'Painting', uk: 'Малярні роботи' },
  wallpaper: { en: 'Wallpaper', uk: 'Шпалери' },
  bathroom: { en: 'Bathroom fit-out', uk: 'Ванна кімната' },
  kitchen: { en: 'Kitchen fit-out', uk: 'Кухня' },
  glass: { en: 'Glazing', uk: 'Скло та вітражі' },
  landscaping: { en: 'Landscaping', uk: 'Благоустрій' },
  pools: { en: 'Pool', uk: 'Басейн' },
  solar: { en: 'Solar', uk: 'Сонячні панелі' },
  'smart-home': { en: 'Smart home', uk: 'Розумний дім' },
}

export const ESTIMATOR_OBJECT_TYPES: EstimatorObjectType[] = [
  {
    id: 'house',
    labelEn: 'House',
    labelUk: 'Будинок',
    engineType: 'new_construction',
    perSqm: 110,
    recommendedWorks: [
      'earthworks',
      'foundation',
      'concrete',
      'masonry',
      'roofing',
      'windows',
      'doors',
      'plumbing',
      'electro',
      'insulation',
      'plastering',
      'flooring',
      'painting',
    ],
  },
  {
    id: 'apartment',
    labelEn: 'Apartment',
    labelUk: 'Квартира',
    engineType: 'renovation',
    perSqm: 95,
    recommendedWorks: [
      'demolition',
      'plumbing',
      'electro',
      'drywall',
      'plastering',
      'flooring',
      'painting',
      'kitchen',
      'bathroom',
    ],
  },
  {
    id: 'hangar',
    labelEn: 'Hangar',
    labelUk: 'Ангар',
    engineType: 'warehouse',
    perSqm: 55,
    recommendedWorks: ['earthworks', 'concrete', 'metal', 'roofing', 'electro', 'doors'],
  },
  {
    id: 'canopy',
    labelEn: 'Canopy / shelter',
    labelUk: 'Навіс',
    engineType: 'other',
    perSqm: 42,
    recommendedWorks: ['concrete', 'metal', 'roofing'],
  },
  {
    id: 'farm',
    labelEn: 'Farm building',
    labelUk: 'Ферма',
    engineType: 'other',
    perSqm: 58,
    recommendedWorks: ['earthworks', 'concrete', 'masonry', 'metal', 'roofing', 'electro', 'plumbing'],
  },
  {
    id: 'garage',
    labelEn: 'Garage',
    labelUk: 'Гараж',
    engineType: 'warehouse',
    perSqm: 62,
    recommendedWorks: ['concrete', 'masonry', 'roofing', 'doors', 'electro'],
  },
  {
    id: 'warehouse',
    labelEn: 'Warehouse',
    labelUk: 'Склад',
    engineType: 'warehouse',
    perSqm: 55,
    recommendedWorks: ['earthworks', 'concrete', 'metal', 'roofing', 'electro', 'doors'],
  },
  {
    id: 'office',
    labelEn: 'Office',
    labelUk: 'Офіс',
    engineType: 'office',
    perSqm: 90,
    recommendedWorks: ['demolition', 'drywall', 'electro', 'hvac', 'flooring', 'painting'],
  },
  {
    id: 'commercial',
    labelEn: 'Commercial premises',
    labelUk: 'Комерція',
    engineType: 'commercial',
    perSqm: 110,
    recommendedWorks: ['demolition', 'concrete', 'masonry', 'electro', 'hvac', 'drywall', 'flooring'],
  },
]

export function getObjectType(id: string | null | undefined): EstimatorObjectType | undefined {
  return ESTIMATOR_OBJECT_TYPES.find((item) => item.id === id)
}

export function objectTypeLabel(id: string | null | undefined, lang: string): string {
  const item = getObjectType(id)
  if (!item) return ''
  return lang.toLowerCase().startsWith('uk') ? item.labelUk : item.labelEn
}

export function workTypeLabel(id: string | null | undefined, lang: string): string {
  if (!id) return ''
  const hit = WORK_LABELS[id]
  if (!hit) return id
  return lang.toLowerCase().startsWith('uk') ? hit.uk : hit.en
}

export function workOrderIndex(workTypeId: string): number {
  const idx = CONSTRUCTION_WORK_ORDER.indexOf(workTypeId as (typeof CONSTRUCTION_WORK_ORDER)[number])
  return idx < 0 ? CONSTRUCTION_WORK_ORDER.length + 50 : idx
}

export function sortWorkPackages(packages: EstimatorWorkPackage[]): EstimatorWorkPackage[] {
  return [...packages].sort((a, b) => workOrderIndex(a.workTypeId) - workOrderIndex(b.workTypeId))
}

export function flattenWorkFeatureIds(packages: EstimatorWorkPackage[] | null | undefined): string[] {
  const ids: string[] = []
  const seen = new Set<string>()
  for (const pack of packages || []) {
    for (const id of pack.selectedFeatureIds || []) {
      if (seen.has(id)) continue
      seen.add(id)
      ids.push(id)
    }
  }
  return ids
}

export function packagesFromRecommended(objectId: EstimatorObjectTypeId): EstimatorWorkPackage[] {
  const object = getObjectType(objectId)
  return (object?.recommendedWorks || []).map((workTypeId) => ({
    workTypeId,
    selectedFeatureIds: [],
  }))
}

export function addWorkPackage(
  packages: EstimatorWorkPackage[],
  workTypeId: string,
): EstimatorWorkPackage[] {
  if (packages.some((pack) => pack.workTypeId === workTypeId)) return sortWorkPackages(packages)
  return sortWorkPackages([...packages, { workTypeId, selectedFeatureIds: [] }])
}

/** Next trade in this object's typical site sequence that is not yet added. */
export function nextRecommendedWork(
  objectId: EstimatorObjectTypeId | null | undefined,
  packages: EstimatorWorkPackage[],
): string | null {
  const object = getObjectType(objectId)
  if (!object) return null
  const have = new Set(packages.map((pack) => pack.workTypeId))
  return object.recommendedWorks.find((workTypeId) => !have.has(workTypeId)) || null
}

export function inferObjectTypeFromLegacy(catalogId: string | null | undefined): EstimatorObjectTypeId {
  const id = (catalogId || '').toLowerCase()
  if (['bathroom', 'kitchen', 'painting', 'wallpaper', 'drywall', 'flooring', 'tiling'].includes(id)) {
    return 'apartment'
  }
  if (['warehouse', 'metal', 'welding'].includes(id)) return 'hangar'
  if (['office', 'commercial'].includes(id)) return id as EstimatorObjectTypeId
  if (id === 'landscaping') return 'house'
  return 'house'
}

export function isEstimatorObjectTypeId(id: string | null | undefined): id is EstimatorObjectTypeId {
  return Boolean(id && ESTIMATOR_OBJECT_TYPES.some((item) => item.id === id))
}
