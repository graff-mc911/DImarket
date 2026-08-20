/** Dimarket remodeling calculator — catalog and estimate shapes. */

export type CalculatorBudgetLevel = 'low' | 'medium' | 'high'

export type CalculatorFeatureUnit = 'm2' | 'unit'

export type CalculatorProjectTypeId =
  | 'bathroom_remodel'
  | 'kitchen_remodel'
  | 'whole_house'
  | 'multi_room'
  | 'addition'
  | 'new_construction'
  | 'roofing'
  | 'painting'
  | 'flooring'
  | 'basement'
  | 'terrace'
  | 'other'

export type CalculatorProjectType = {
  id: CalculatorProjectTypeId
  slug: CalculatorProjectTypeId
  nameKey: string
  active: boolean
  sortOrder: number
}

export type CalculatorFeature = {
  id: string
  projectTypeId: CalculatorProjectTypeId
  nameKey: string
  unit: CalculatorFeatureUnit
  laborPrice: number | null
  materialPrice: number | null
  lowMultiplier: number
  mediumMultiplier: number
  highMultiplier: number
  active: boolean
  sortOrder: number
}

export type CalculatorCatalog = {
  projectTypes: CalculatorProjectType[]
  features: CalculatorFeature[]
}

export type CalculatorSelectedItem = {
  featureId: string
  nameKey: string
  quantity: number
  unit: CalculatorFeatureUnit
  laborTotal: number
  materialsTotal: number
  lineTotal: number
  missingPrice: boolean
}

export type CalculatorEstimate = {
  laborTotal: number
  materialsTotal: number
  projectTotal: number
  selectedItems: CalculatorSelectedItem[]
  missingPriceFeatureIds: string[]
}

export type CalculatorStateInput = {
  projectType: CalculatorProjectTypeId | null
  area: number
  budgetLevel: CalculatorBudgetLevel
  includeMaterials: boolean
  selectedFeatureIds: string[]
}

/** Payload passed into the existing estimate / hire-contractor flow. */
export type CalculatorProjectPayload = {
  projectType: CalculatorProjectTypeId
  area: number
  budgetLevel: CalculatorBudgetLevel
  includeMaterials: boolean
  selectedFeatures: Array<{
    id: string
    quantity: number
    unit: CalculatorFeatureUnit
    laborTotal: number
    materialsTotal: number
  }>
  estimatedLabor: number
  estimatedMaterials: number
  estimatedTotal: number
}
