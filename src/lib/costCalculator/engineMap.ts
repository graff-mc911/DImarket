import type { EstimatorProjectTypeId } from '../costEstimatorTypes'
import type { CalculatorProjectTypeId } from './types'

/** Maps calculator remodel types onto the existing specialist-matching engine. */
export const CALCULATOR_TYPE_TO_ENGINE: Record<CalculatorProjectTypeId, EstimatorProjectTypeId> = {
  bathroom_remodel: 'bathroom',
  kitchen_remodel: 'kitchen',
  whole_house: 'house_renovation',
  multi_room: 'renovation',
  addition: 'new_construction',
  new_construction: 'new_construction',
  roofing: 'roof',
  painting: 'painting',
  flooring: 'flooring',
  basement: 'renovation',
  terrace: 'landscaping',
  other: 'other',
}
