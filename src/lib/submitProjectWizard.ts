import { supabase } from './supabase'
import { runMatchingForListing } from './matching/persistMatches'
import {
  fileKindFromMime,
  wizardTitleFromTrade,
  type ProjectWizardState,
  PROJECT_TRADES,
} from './projectWizard'

async function resolveConstructionCategoryId(): Promise<string | null> {
  const { data } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', 'construction')
    .maybeSingle()
  return (data as { id: string } | null)?.id ?? null
}

export async function uploadProjectFile(
  userId: string,
  listingId: string,
  file: File,
): Promise<{ url: string; path: string; kind: ReturnType<typeof fileKindFromMime> } | null> {
  const kind = fileKindFromMime(file.type, file.name)
  const safe = file.name.replace(/[^\w.-]+/g, '_')
  const path = `${userId}/${listingId}/${Date.now()}_${safe}`
  const { error } = await supabase.storage.from('project-files').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) {
    console.error('project file upload:', error)
    return null
  }
  const { data } = supabase.storage.from('project-files').getPublicUrl(path)
  return { url: data.publicUrl, path, kind }
}

export async function submitProjectWizard(
  userId: string,
  state: ProjectWizardState,
  tradeLabel: string,
): Promise<{ listingId: string } | { error: string }> {
  if (!state.tradeId || !state.description.trim() || !state.contactName.trim()) {
    return { error: 'incomplete' }
  }

  const categoryId = await resolveConstructionCategoryId()
  const location =
    state.locationLabel.trim() ||
    [state.city, state.postalCode, state.country].filter(Boolean).join(', ')

  const expires = new Date()
  expires.setDate(expires.getDate() + 30)

  const trade = PROJECT_TRADES.find((t) => t.id === state.tradeId)
  const subcategorySlugs = trade ? [trade.subcategorySlug] : []

  const { data: listing, error } = await supabase
    .from('listings')
    .insert({
      title: wizardTitleFromTrade(tradeLabel, state.city),
      description: state.description.trim(),
      category_id: categoryId,
      listing_type: 'service_request',
      price: state.budgetMax || state.budgetMin || null,
      currency: 'EUR',
      location: location || 'EU',
      contact_name: state.contactName.trim(),
      contact_phone: state.contactPhone.trim() || null,
      contact_email: state.contactEmail.trim() || null,
      author_id: userId,
      duration_days: 30,
      expires_at: expires.toISOString(),
      status: 'active',
      subcategory_slugs: subcategorySlugs,
      budget_min: state.budgetMin,
      budget_max: state.budgetMax,
      deadline_type: state.deadlineType,
      deadline_at: state.deadlineType === 'date' && state.deadlineAt ? state.deadlineAt : null,
      urgency: state.deadlineType === 'asap' ? 'urgent' : state.urgency,
      preferred_language: state.preferredLanguage || null,
      wizard_completed: true,
      pipeline_stage: 'matched',
      postal_code: state.postalCode.trim() || null,
      country_name: state.country.trim() || null,
      city_name: state.city.trim() || null,
      latitude: state.latitude,
      longitude: state.longitude,
      visibility_radius: 'country',
    } as never)
    .select('id')
    .single()

  if (error || !listing) {
    console.error('submitProjectWizard:', error)
    return { error: error?.message || 'create_failed' }
  }

  const listingId = (listing as { id: string }).id

  for (const draft of state.files) {
    const uploaded = await uploadProjectFile(userId, listingId, draft.file)
    if (!uploaded) continue
    await supabase.from('project_files').insert({
      listing_id: listingId,
      url: uploaded.url,
      storage_path: uploaded.path,
      mime_type: draft.file.type,
      file_name: draft.file.name,
      kind: uploaded.kind,
    } as never)
  }

  await runMatchingForListing(listingId, {
    categorySlug: 'construction',
    subcategorySlugs,
    city: state.city || undefined,
    country: state.country || undefined,
    latitude: state.latitude,
    longitude: state.longitude,
    radiusKm: 150,
    language: state.preferredLanguage || undefined,
    preferredLanguages: state.preferredLanguage ? [state.preferredLanguage] : undefined,
    maxBudget: state.budgetMax || undefined,
  })

  return { listingId }
}
