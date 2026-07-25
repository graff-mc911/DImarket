import { MainCategoriesSection } from './MainCategoriesSection'

/** Standalone searchable main-categories block (Supabase-driven). */
export function ChooseCategorySection({
  id = 'choose-category',
  compact = false,
}: {
  id?: string
  compact?: boolean
}) {
  return (
    <MainCategoriesSection
      id={id}
      showSearch
      className={compact ? 'main-categories-section--compact' : ''}
    />
  )
}
