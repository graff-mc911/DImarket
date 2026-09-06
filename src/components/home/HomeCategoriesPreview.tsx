import { CabinetCategoryBrowser } from '../CabinetCategoryBrowser'

interface HomeCategoriesPreviewProps {
  /** Kept for Home.tsx call-site compatibility; browser loads its own data. */
  categories?: unknown
  loading?: boolean
}

/** Home "Категорії" block — same square cabinet cards as /categories. */
export function HomeCategoriesPreview(_props: HomeCategoriesPreviewProps) {
  return (
    <div id="choose-category">
      <CabinetCategoryBrowser mode="categories" headingAs="h2" />
    </div>
  )
}
