import { MainCategoriesSection } from './MainCategoriesSection'

/** Standalone searchable categories block — full static DImarket catalog. */
export function ChooseCategorySection({
  id = 'choose-category',
}: {
  id?: string
  /** Kept for call-site compatibility. */
  compact?: boolean
}) {
  return <MainCategoriesSection id={id} showSearch />
}
