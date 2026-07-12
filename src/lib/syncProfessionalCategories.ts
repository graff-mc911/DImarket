import { supabase } from './supabase'
import { categorySlugForSubcategory } from './categoryCatalog'

export async function syncProfessionalCategoriesFromWorkSlugs(
  userId: string,
  subcategorySlugs: string[],
): Promise<void> {
  const categorySlugs = new Set<string>()
  for (const sub of subcategorySlugs) {
    const cat = categorySlugForSubcategory(sub)
    if (cat) categorySlugs.add(cat)
  }

  if (categorySlugs.size === 0) {
    await supabase
      .from('professional_categories')
      .delete()
      .eq('profile_id', userId)
    return
  }

  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id, slug')
    .in('slug', [...categorySlugs])

  if (catError || !categories?.length) return

  await supabase.from('professional_categories').delete().eq('profile_id', userId)

  const rows = categories.map((cat) => ({
    profile_id: userId,
    category_id: cat.id,
  }))

  const { error: insertError } = await supabase
    .from('professional_categories')
    .insert(rows)

  if (insertError) {
    console.error('syncProfessionalCategories:', insertError.message)
  }
}
