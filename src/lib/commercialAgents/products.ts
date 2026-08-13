import { supabase } from '../supabase'

export type ManufacturerProduct = {
  id: string
  manufacturer_id: string
  name: string
  brand: string | null
  category: string | null
  subcategory: string | null
  description: string
  specifications: Record<string, unknown>
  image_urls: string[]
  document_urls: string[]
  catalogue_url: string | null
  countries_available: string[]
  is_published: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type ManufacturerProductInput = {
  name: string
  brand?: string | null
  category?: string | null
  subcategory?: string | null
  description?: string
  specifications?: Record<string, unknown>
  image_urls?: string[]
  document_urls?: string[]
  catalogue_url?: string | null
  countries_available?: string[]
  is_published?: boolean
  sort_order?: number
}

// Table is added by migration 20260813190000 — cast until types.ts regenerates.
const productsTable = () => supabase.from('manufacturer_products' as never)

export async function fetchManufacturerProducts(
  manufacturerId: string,
  opts?: { publishedOnly?: boolean },
): Promise<ManufacturerProduct[]> {
  let q = productsTable()
    .select('*')
    .eq('manufacturer_id', manufacturerId)
    .order('sort_order', { ascending: true })
    .order('updated_at', { ascending: false })

  if (opts?.publishedOnly) q = q.eq('is_published', true)

  const { data, error } = await q
  if (error) {
    console.error('fetchManufacturerProducts', error)
    return []
  }
  return (data as unknown as ManufacturerProduct[]) ?? []
}

export async function searchPublishedProducts(input: {
  query?: string
  category?: string | null
  brand?: string | null
  country?: string | null
  limit?: number
}): Promise<ManufacturerProduct[]> {
  let q = productsTable()
    .select('*')
    .eq('is_published', true)
    .order('updated_at', { ascending: false })
    .limit(input.limit ?? 40)

  if (input.category) q = q.eq('category', input.category)
  if (input.brand) q = q.ilike('brand', `%${input.brand}%`)
  if (input.country) q = q.contains('countries_available', [input.country])
  if (input.query?.trim()) {
    const t = `%${input.query.trim()}%`
    q = q.or(`name.ilike.${t},brand.ilike.${t},description.ilike.${t}`)
  }

  const { data, error } = await q
  if (error) {
    console.error('searchPublishedProducts', error)
    return []
  }
  return (data as unknown as ManufacturerProduct[]) ?? []
}

export async function createManufacturerProduct(
  manufacturerId: string,
  input: ManufacturerProductInput,
): Promise<{ row: ManufacturerProduct | null; error: string | null }> {
  const { data, error } = await productsTable()
    .insert({
      manufacturer_id: manufacturerId,
      name: input.name.trim(),
      brand: input.brand?.trim() || null,
      category: input.category || null,
      subcategory: input.subcategory || null,
      description: input.description || '',
      specifications: input.specifications || {},
      image_urls: input.image_urls || [],
      document_urls: input.document_urls || [],
      catalogue_url: input.catalogue_url || null,
      countries_available: input.countries_available || [],
      is_published: input.is_published ?? true,
      sort_order: input.sort_order ?? 0,
    } as never)
    .select('*')
    .single()
  if (error) return { row: null, error: error.message }
  return { row: data as unknown as ManufacturerProduct, error: null }
}

export async function updateManufacturerProduct(
  productId: string,
  patch: Partial<ManufacturerProductInput>,
): Promise<{ error: string | null }> {
  const { error } = await productsTable()
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', productId)
  return { error: error?.message ?? null }
}

export async function deleteManufacturerProduct(productId: string): Promise<{ error: string | null }> {
  const { error } = await productsTable().delete().eq('id', productId)
  return { error: error?.message ?? null }
}
