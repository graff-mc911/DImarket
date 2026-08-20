import { estimatorGeoMultiplier, vatRateForCountry } from './costEstimatorGeo'
import { getProjectType, type EstimatorState, type PricingTierId } from './costEstimatorTypes'
import { estimatorTypeFromCatalogId } from './estimatorMainCategories'
import { flattenWorkFeatureIds, workTypeLabel } from './estimatorObjectTypes'

export type CalculatorFeature = {
  id: string
  labelEn: string
  labelUk: string
  kind: 'flat' | 'perSqm'
  amount: number
}

const TIER_MUL: Record<PricingTierId, number> = {
  economy: 0.78,
  standard: 1,
  premium: 1.32,
}

function f(
  id: string,
  labelEn: string,
  labelUk: string,
  amount: number,
  kind: 'flat' | 'perSqm' = 'flat',
): CalculatorFeature {
  return { id, labelEn, labelUk, amount, kind }
}

const GENERIC: CalculatorFeature[] = [
  f('gen-prep', 'Site preparation', 'Підготовка майданчика', 180),
  f('gen-demo', 'Demolition / removal', 'Демонтаж', 22, 'perSqm'),
  f('gen-install', 'Core installation', 'Основний монтаж', 38, 'perSqm'),
  f('gen-finish', 'Finishing', 'Фінішне оздоблення', 24, 'perSqm'),
  f('gen-waste', 'Waste disposal', 'Вивіз сміття', 160),
  f('gen-protect', 'Surface protection', 'Захист поверхонь', 90),
]

const FEATURES: Record<string, CalculatorFeature[]> = {
  bathroom: [
    f('bath-demo', 'Bathroom demolition', 'Демонтаж ванної', 45, 'perSqm'),
    f('bath-waterproof', 'Waterproofing', 'Гідроізоляція', 38, 'perSqm'),
    f('bath-tile-floor', 'Floor tile', 'Плитка на підлогу', 42, 'perSqm'),
    f('bath-tile-wall', 'Wall tile', 'Плитка на стіни', 48, 'perSqm'),
    f('bath-vanity', 'Vanity + sink', 'Тумба з умивальником', 420),
    f('bath-toilet', 'Toilet replacement', 'Заміна унітаза', 180),
    f('bath-shower', 'Shower enclosure', 'Душова кабіна', 650),
    f('bath-tub', 'Bathtub', 'Ванна', 480),
    f('bath-tap', 'Mixer taps', 'Змішувачі', 140),
    f('bath-plumb-move', 'Plumbing relocation', 'Перенесення комунікацій', 520),
    f('bath-heat', 'Underfloor heating', 'Тепла підлога', 55, 'perSqm'),
    f('bath-fan', 'Extractor fan', 'Вентилятор', 95),
    f('bath-light', 'Bathroom lighting', 'Освітлення ванної', 120),
    f('bath-door', 'Bathroom door', 'Двері у ванну', 220),
  ],
  kitchen: [
    f('kit-demo', 'Kitchen demolition', 'Демонтаж кухні', 40, 'perSqm'),
    f('kit-cabinets', 'Cabinets', 'Кухонні шафи', 280, 'perSqm'),
    f('kit-counter', 'Worktop', 'Стільниця', 95, 'perSqm'),
    f('kit-sink', 'Sink + tap', 'Мийка і змішувач', 260),
    f('kit-splash', 'Splashback', 'Фартух', 48, 'perSqm'),
    f('kit-floor', 'Kitchen flooring', 'Підлога на кухні', 42, 'perSqm'),
    f('kit-plumb', 'Plumbing connections', 'Підключення води', 220),
    f('kit-electro', 'Electrical points', 'Електроточки', 180),
    f('kit-hood', 'Cooker hood', 'Витяжка', 240),
    f('kit-appliance', 'Appliance install', 'Встановлення техніки', 160),
    f('kit-light', 'Task lighting', 'Робоче світло', 140),
    f('kit-paint', 'Walls & ceiling paint', 'Фарбування стін і стелі', 18, 'perSqm'),
  ],
  roof: [
    f('roof-strip', 'Strip old covering', 'Зняття старого покриття', 18, 'perSqm'),
    f('roof-felt', 'Underlay / membrane', 'Підкладка / мембрана', 14, 'perSqm'),
    f('roof-tile', 'Tile / metal covering', 'Черепиця / метал', 55, 'perSqm'),
    f('roof-insul', 'Roof insulation', 'Утеплення даху', 28, 'perSqm'),
    f('roof-flash', 'Flashings', 'Оброблення примикань', 210),
    f('roof-gutter', 'Gutters & downpipes', 'Водостічна система', 18, 'perSqm'),
    f('roof-window', 'Roof window', 'Мансардне вікно', 480),
    f('roof-ridge', 'Ridge / ventilation', 'Коник / вентиляція', 160),
  ],
  flooring: [
    f('fl-remove', 'Remove old floor', 'Зняття старої підлоги', 12, 'perSqm'),
    f('fl-screed', 'Screed / leveling', 'Стяжка / вирівнювання', 22, 'perSqm'),
    f('fl-laminate', 'Laminate', 'Ламінат', 28, 'perSqm'),
    f('fl-wood', 'Hardwood', 'Паркет / дошка', 62, 'perSqm'),
    f('fl-vinyl', 'Vinyl / SPC', 'Вініл / SPC', 32, 'perSqm'),
    f('fl-tile', 'Porcelain tile', 'Керамограніт', 48, 'perSqm'),
    f('fl-base', 'Skirting', 'Плінтус', 8, 'perSqm'),
    f('fl-under', 'Underlay / vapor barrier', 'Підкладка', 6, 'perSqm'),
  ],
  windows: [
    f('win-measure', 'Measure & survey', 'Замір', 80),
    f('win-remove', 'Remove old window', 'Демонтаж вікна', 70),
    f('win-unit', 'New window unit', 'Нове вікно', 380),
    f('win-install', 'Install & seal', 'Монтаж і герметизація', 140),
    f('win-sill', 'Window sill', 'Підвіконня', 85),
    f('win-trim', 'Interior trim', 'Внутрішні лиштви', 60),
    f('win-ext', 'Exterior finishing', 'Зовнішнє оздоблення', 90),
  ],
  painting: [
    f('pt-prep', 'Surface prep', 'Підготовка поверхні', 8, 'perSqm'),
    f('pt-fill', 'Fill & sand', 'Шпаклівка і шліфування', 12, 'perSqm'),
    f('pt-primer', 'Primer', 'Ґрунтовка', 5, 'perSqm'),
    f('pt-walls', 'Wall paint (2 coats)', 'Фарба стін (2 шари)', 11, 'perSqm'),
    f('pt-ceil', 'Ceiling paint', 'Фарба стелі', 10, 'perSqm'),
    f('pt-trim', 'Doors & trim', 'Двері та лиштви', 45),
    f('pt-protect', 'Furniture protection', 'Захист меблів', 70),
  ],
  plumbing: [
    f('pl-pipe', 'Pipe replacement', 'Заміна труб', 28, 'perSqm'),
    f('pl-points', 'New water points', 'Нові точки води', 160),
    f('pl-boiler', 'Boiler / heater work', 'Котел / бойлер', 320),
    f('pl-radiator', 'Radiator', 'Радіатор', 180),
    f('pl-leak', 'Leak repair', 'Усунення протікання', 90),
    f('pl-waste', 'Waste line', 'Каналізація', 140),
  ],
  electrical: [
    f('el-panel', 'Consumer unit', 'Щиток', 280),
    f('el-rewire', 'Partial rewire', 'Часткова заміна проводки', 32, 'perSqm'),
    f('el-socket', 'Sockets & switches', 'Розетки і вимикачі', 28),
    f('el-light', 'Light points', 'Точки освітлення', 35),
    f('el-earth', 'Earthing / safety', 'Заземлення', 120),
    f('el-smart', 'Smart switches', 'Розумні вимикачі', 55),
  ],
  hvac: [
    f('hv-split', 'Split AC indoor + outdoor', 'Спліт-система', 780),
    f('hv-multi', 'Multi-split extra head', 'Додатковий внутрішній блок', 420),
    f('hv-duct', 'Duct work', 'Повітроводи', 24, 'perSqm'),
    f('hv-vent', 'Mechanical ventilation', 'Механічна вентиляція', 18, 'perSqm'),
    f('hv-filter', 'Filters & commissioning', 'Фільтри і пуск', 90),
  ],
  tiling: [
    f('ti-prep', 'Substrate prep', 'Підготовка основи', 14, 'perSqm'),
    f('ti-floor', 'Floor tiling', 'Плитка на підлогу', 38, 'perSqm'),
    f('ti-wall', 'Wall tiling', 'Плитка на стіни', 42, 'perSqm'),
    f('ti-mosaic', 'Mosaic / decor', 'Мозаїка / декор', 55, 'perSqm'),
    f('ti-grout', 'Grout & seal', 'Затирка і герметизація', 8, 'perSqm'),
  ],
  drywall: [
    f('dw-frame', 'Metal stud frame', 'Каркас', 16, 'perSqm'),
    f('dw-board', 'Boarding', 'Обшивка ГКЛ', 18, 'perSqm'),
    f('dw-tape', 'Tape & joint', 'Шви і стрічка', 10, 'perSqm'),
    f('dw-skim', 'Skim coat', 'Фінішна шпаклівка', 12, 'perSqm'),
    f('dw-sound', 'Acoustic insulation', 'Звукоізоляція', 14, 'perSqm'),
  ],
  facade: [
    f('fa-scaffold', 'Scaffolding', 'Риштування', 18, 'perSqm'),
    f('fa-insul', 'External insulation', 'Утеплення фасаду', 42, 'perSqm'),
    f('fa-render', 'Render / cladding', 'Штукатурка / облицювання', 38, 'perSqm'),
    f('fa-paint', 'Facade paint', 'Фарба фасаду', 16, 'perSqm'),
    f('fa-sill', 'Window reveals', 'Відкоси', 12, 'perSqm'),
  ],
  landscaping: [
    f('ld-clear', 'Clear site', 'Розчищення', 8, 'perSqm'),
    f('ld-turf', 'Lawn / turf', 'Газон', 12, 'perSqm'),
    f('ld-pave', 'Paving', 'Мощення', 45, 'perSqm'),
    f('ld-fence', 'Fence panel', 'Секція паркану', 85),
    f('ld-drain', 'Drainage', 'Дренаж', 16, 'perSqm'),
    f('ld-plant', 'Planting', 'Посадка рослин', 9, 'perSqm'),
  ],
  pool: [
    f('po-excavate', 'Excavation', 'Котлован', 35, 'perSqm'),
    f('po-shell', 'Shell / liner', 'Чаша / лайнер', 220, 'perSqm'),
    f('po-plant', 'Plant room', 'Техмашинне', 1200),
    f('po-tile', 'Pool tiling', 'Плитка басейну', 85, 'perSqm'),
    f('po-cover', 'Cover', 'Накриття', 480),
  ],
  solar: [
    f('so-survey', 'Roof survey', 'Обстеження даху', 120),
    f('so-panel', 'PV panels', 'Панелі', 180, 'perSqm'),
    f('so-inverter', 'Inverter', 'Інвертор', 650),
    f('so-mount', 'Mounting', 'Кріплення', 28, 'perSqm'),
    f('so-grid', 'Grid connection', 'Підключення до мережі', 320),
  ],
  renovation: [
    f('rv-demo', 'Strip-out', 'Демонтаж', 28, 'perSqm'),
    f('rv-mep', 'MEP rough-in', 'Інженерія', 32, 'perSqm'),
    f('rv-walls', 'Walls & ceilings', 'Стіни і стелі', 26, 'perSqm'),
    f('rv-floor', 'New flooring', 'Нова підлога', 36, 'perSqm'),
    f('rv-paint', 'Decoration', 'Оздоблення', 14, 'perSqm'),
    f('rv-doors', 'Interior doors', 'Міжкімнатні двері', 190),
    f('rv-kitchen', 'Kitchen package', 'Пакет кухні', 2400),
    f('rv-bath', 'Bathroom package', 'Пакет ванної', 1800),
  ],
  new_construction: [
    f('nc-found', 'Foundations', 'Фундамент', 95, 'perSqm'),
    f('nc-shell', 'Structure / shell', 'Коробка', 180, 'perSqm'),
    f('nc-roof', 'Roof', 'Дах', 85, 'perSqm'),
    f('nc-mep', 'MEP first & second fix', 'Інженерія', 70, 'perSqm'),
    f('nc-finish', 'Interior finishes', 'Внутрішнє оздоблення', 90, 'perSqm'),
    f('nc-ext', 'External works', 'Благоустрій', 28, 'perSqm'),
  ],
}

FEATURES.house_renovation = FEATURES.renovation
FEATURES.roofing = FEATURES.roof
FEATURES.electro = FEATURES.electrical
FEATURES.pools = FEATURES.pool
FEATURES.wallpaper = [
  f('wp-strip', 'Strip old wallpaper', 'Зняття шпалер', 6, 'perSqm'),
  f('wp-liner', 'Lining paper', 'Малярний флізелін', 7, 'perSqm'),
  f('wp-hang', 'Hang wallpaper', 'Поклейка шпалер', 14, 'perSqm'),
  f('wp-trim', 'Corners & sockets', 'Кути і розетки', 4, 'perSqm'),
]
FEATURES.carpentry = [
  f('cp-frame', 'Framing', 'Каркас', 28, 'perSqm'),
  f('cp-door', 'Door hanging', 'Навішування дверей', 120),
  f('cp-built', 'Built-in unit', 'Вбудовані меблі', 380),
  f('cp-trim', 'Skirting & architrave', 'Плінтус і лиштви', 12, 'perSqm'),
]
FEATURES.insulation = [
  f('in-wall', 'Wall insulation', 'Утеплення стін', 32, 'perSqm'),
  f('in-loft', 'Loft insulation', 'Утеплення горища', 18, 'perSqm'),
  f('in-floor', 'Floor insulation', 'Утеплення підлоги', 22, 'perSqm'),
  f('in-vapor', 'Vapor barrier', 'Пароізоляція', 6, 'perSqm'),
]
FEATURES.doors = [
  f('dr-remove', 'Remove old door', 'Демонтаж дверей', 45),
  f('dr-unit', 'Door leaf + frame', 'Полотно + коробка', 240),
  f('dr-hang', 'Hang & adjust', 'Навішування', 70),
  f('dr-lock', 'Lockset', 'Замок', 55),
  f('dr-trim', 'Architraves', 'Лиштви', 40),
]
FEATURES.demolition = [
  f('dm-soft', 'Soft strip', 'Мʼякий демонтаж', 18, 'perSqm'),
  f('dm-hard', 'Structural demolition', 'Несучий демонтаж', 45, 'perSqm'),
  f('dm-waste', 'Skip & haulage', 'Контейнер і вивіз', 220),
  f('dm-protect', 'Neighbor protection', 'Захист сусідів', 140),
]
FEATURES.earthworks = [
  f('ew-excavate', 'Excavation', 'Виїмка ґрунту', 16, 'perSqm'),
  f('ew-fill', 'Fill & compact', 'Засипка і трамбування', 12, 'perSqm'),
  f('ew-drain', 'Land drain', 'Дренаж', 18, 'perSqm'),
]
FEATURES.foundation = [
  f('fd-excavate', 'Foundation excavation', 'Котлован фундаменту', 28, 'perSqm'),
  f('fd-steel', 'Rebar', 'Арматура', 22, 'perSqm'),
  f('fd-pour', 'Concrete pour', 'Бетонування', 48, 'perSqm'),
  f('fd-water', 'Tanking', 'Гідроізоляція фундаменту', 16, 'perSqm'),
]
FEATURES.concrete = [
  f('cn-form', 'Formwork', 'Опалубка', 18, 'perSqm'),
  f('cn-rebar', 'Rebar cage', 'Арматурний каркас', 24, 'perSqm'),
  f('cn-slab', 'Slab pour', 'Бетонування плити', 42, 'perSqm'),
  f('cn-wall', 'Walls / columns', 'Стіни / колони', 48, 'perSqm'),
  f('cn-pump', 'Concrete pump', 'Подача бетону насосом', 220),
  f('cn-screed', 'Screed', 'Стяжка', 16, 'perSqm'),
  f('cn-cure', 'Curing', 'Догляд за бетоном', 6, 'perSqm'),
  f('cn-joint', 'Expansion joints', 'Деформаційні шви', 90),
]
FEATURES.masonry = [
  f('ms-brick', 'Brickwork', 'Кладка цегли', 55, 'perSqm'),
  f('ms-block', 'Blockwork', 'Кладка блоків', 38, 'perSqm'),
  f('ms-aac', 'Aerated concrete blocks', 'Газоблок / піноблок', 32, 'perSqm'),
  f('ms-lintel', 'Lintels', 'Перемички', 45),
  f('ms-open', 'Openings / reveals', 'Прорізи та відкоси', 12, 'perSqm'),
  f('ms-insul', 'Cavity insulation', 'Утеплення в кладці', 14, 'perSqm'),
  f('ms-mesh', 'Masonry mesh', 'Кладочна сітка', 6, 'perSqm'),
  f('ms-point', 'Pointing', 'Розшивка швів', 22, 'perSqm'),
]
FEATURES.plastering = [
  f('ps-base', 'Base coat', 'Набризк / ґрунт', 10, 'perSqm'),
  f('ps-finish', 'Finish plaster', 'Накривка', 16, 'perSqm'),
  f('ps-bead', 'Beads & corners', 'Кутики', 5, 'perSqm'),
]
FEATURES.welding = [
  f('we-frame', 'Steel frame', 'Металокаркас', 85, 'perSqm'),
  f('we-stair', 'Steel stair', 'Металеві сходи', 920),
  f('we-gate', 'Gate / railing', 'Ворота / огорожа', 240),
]
FEATURES.metal = FEATURES.welding
FEATURES.glass = [
  f('gl-unit', 'Glazing unit', 'Склопакет', 160),
  f('gl-balus', 'Glass balustrade', 'Скляна огорожа', 220, 'perSqm'),
  f('gl-part', 'Glass partition', 'Скляна перегородка', 180, 'perSqm'),
]
FEATURES['smart-home'] = [
  f('sm-hub', 'Hub / controller', 'Хаб', 180),
  f('sm-switch', 'Smart switch', 'Розумний вимикач', 45),
  f('sm-therm', 'Smart thermostat', 'Термостат', 160),
  f('sm-cam', 'Camera', 'Камера', 120),
]
FEATURES['design-engineering'] = [
  f('de-survey', 'Measured survey', 'Обміри', 220),
  f('de-concept', 'Concept design', 'Концепція', 480),
  f('de-permit', 'Permit drawings', 'Проєкт для дозволу', 650),
  f('de-spec', 'Specification', 'Специфікація', 280),
]
FEATURES.commercial = FEATURES.renovation
FEATURES.office = FEATURES.renovation
FEATURES.warehouse = FEATURES.renovation
FEATURES.living_room = FEATURES.painting
FEATURES.bedroom = FEATURES.painting
FEATURES.other = GENERIC

export function featuresForCatalog(catalogId: string | null | undefined): CalculatorFeature[] {
  if (!catalogId) return []
  return FEATURES[catalogId] || GENERIC
}

export function featureById(id: string): CalculatorFeature | undefined {
  for (const list of Object.values(FEATURES)) {
    const hit = list.find((item) => item.id === id)
    if (hit) return hit
  }
  return GENERIC.find((item) => item.id === id)
}

export function featureLabel(feature: CalculatorFeature, lang: string): string {
  return lang.toLowerCase().startsWith('uk') ? feature.labelUk : feature.labelEn
}

export function budgetTierFromRange(value: 'low' | 'medium' | 'high'): PricingTierId {
  if (value === 'low') return 'economy'
  if (value === 'high') return 'premium'
  return 'standard'
}

export function rangeFromBudgetTier(tier: PricingTierId): 'low' | 'medium' | 'high' {
  if (tier === 'economy') return 'low'
  if (tier === 'premium') return 'high'
  return 'medium'
}

export type CalculatorPreviewLine = {
  id: string
  label: string
  amount: number
  workTypeId?: string
}

export type CalculatorPreview = {
  labor: number
  materials: number
  features: number
  vat: number
  total: number
  lines: CalculatorPreviewLine[]
}

function roundEuro(n: number): number {
  if (n < 100) return Math.round(n / 5) * 5
  if (n < 1000) return Math.round(n / 10) * 10
  return Math.round(n / 50) * 50
}

export function computeCalculatorPreview(
  state: Pick<
    EstimatorState,
    | 'projectTypeId'
    | 'objectTypeId'
    | 'calculatorTypeId'
    | 'workPackages'
    | 'measurements'
    | 'location'
    | 'selectedFeatureIds'
    | 'includeMaterials'
    | 'budgetTier'
  >,
  lang: string,
): CalculatorPreview {
  const catalogId = state.calculatorTypeId || state.projectTypeId
  const type = getProjectType(state.projectTypeId || estimatorTypeFromCatalogId(catalogId))
  const area = Math.max(0, Number(state.measurements.areaSqm) || 0)
  const geo = estimatorGeoMultiplier(state.location.country, state.location.city)
  const tierMul = TIER_MUL[state.budgetTier] || 1
  const selectedIds =
    state.selectedFeatureIds?.length
      ? state.selectedFeatureIds
      : flattenWorkFeatureIds(state.workPackages)
  const perSqm = type.perSqm
  const laborShare = type.laborShare

  const base = perSqm * area * geo
  let labor = base * laborShare
  let materials = state.includeMaterials ? base * (1 - laborShare) * 0.82 : 0
  let features = 0
  const lines: CalculatorPreviewLine[] = []

  const selected = featuresForCatalog(catalogId).filter((item) => selectedIds.includes(item.id))
  for (const item of selected) {
    const raw = item.kind === 'perSqm' ? item.amount * Math.max(area, 1) * geo : item.amount * geo
    const amount = state.includeMaterials ? raw : raw * laborShare
    features += amount
    lines.push({
      id: item.id,
      label: featureLabel(item, lang),
      amount: roundEuro(amount * tierMul),
      workTypeId: catalogId ? String(catalogId) : undefined,
    })
  }

  labor *= tierMul
  materials *= tierMul
  features *= tierMul
  const sub = labor + materials + features
  const vat = sub * vatRateForCountry(state.location.country)
  return {
    labor: roundEuro(labor),
    materials: roundEuro(materials),
    features: roundEuro(features),
    vat: roundEuro(vat),
    total: roundEuro(sub + vat),
    lines,
  }
}

export function descriptionFromFeatures(
  catalogId: string | null,
  selectedIds: string[],
  lang: string,
  packages?: EstimatorState['workPackages'],
): string {
  if (packages?.length) {
    const parts = packages
      .map((pack) => {
        const labels = featuresForCatalog(pack.workTypeId)
          .filter((item) => pack.selectedFeatureIds.includes(item.id))
          .map((item) => featureLabel(item, lang))
        const work = workTypeLabel(pack.workTypeId, lang)
        if (!labels.length) return work
        return `${work}: ${labels.join(', ')}`
      })
      .filter(Boolean)
    if (parts.length) {
      return lang.toLowerCase().startsWith('uk')
        ? `Роботи по черзі: ${parts.join('; ')}.`
        : `Works in sequence: ${parts.join('; ')}.`
    }
  }
  const labels = featuresForCatalog(catalogId)
    .filter((item) => selectedIds.includes(item.id))
    .map((item) => featureLabel(item, lang))
  if (!labels.length) return catalogId ? `Project: ${catalogId}` : ''
  return lang.toLowerCase().startsWith('uk')
    ? `Опції: ${labels.join(', ')}.`
    : `Selected features: ${labels.join(', ')}.`
}

export function featureExtraEur(
  catalogId: string | null | undefined,
  selectedIds: string[],
  area: number,
  country?: string,
  city?: string,
  includeMaterials = true,
  laborShare = 0.5,
): number {
  const geo = estimatorGeoMultiplier(country, city)
  let extra = 0
  const ids = selectedIds.length ? selectedIds : []
  const items = ids
    .map((id) => featureById(id))
    .filter((item): item is CalculatorFeature => Boolean(item))
  const list = items.length ? items : featuresForCatalog(catalogId).filter((item) => ids.includes(item.id))
  for (const item of list) {
    const raw = item.kind === 'perSqm' ? item.amount * Math.max(area, 1) * geo : item.amount * geo
    extra += includeMaterials ? raw : raw * laborShare
  }
  return extra
}

export function featureExtraEurFromPackages(
  packages: EstimatorState['workPackages'] | null | undefined,
  area: number,
  country?: string,
  city?: string,
  includeMaterials = true,
  laborShare = 0.5,
): number {
  return featureExtraEur(
    null,
    flattenWorkFeatureIds(packages),
    area,
    country,
    city,
    includeMaterials,
    laborShare,
  )
}
