import { CabinetCategoryBrowser } from './CabinetCategoryBrowser'

/** Standalone searchable categories block — owner-cabinet card grid. */
export function ChooseCategorySection({
  id = 'choose-category',
}: {
  id?: string
  /** Kept for call-site compatibility; compact layout is unused with cabinet cards. */
  compact?: boolean
}) {
  return (
    <div id={id}>
      <CabinetCategoryBrowser mode="categories" />
    </div>
  )
}
