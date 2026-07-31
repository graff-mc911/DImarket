import { supabase } from './supabase'
import { runMatchingForListing } from './matching/persistMatches'
import {
  fileKindFromMime,
  mapDeadlineForDb,
  wizardTitleFromTrade,
  type ProjectWizardState,
  PROJECT_TRADES,
} from './projectWizard'
import { markWizardDraftPublished } from './wizardDrafts'

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
  const safe = file.name.replace(/[^\w.\-]+/g, '_')
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

function listingPayload(
  userId: string,
  state: ProjectWizardState,
  tradeLabel: string,
  categoryId: string | null,
  status: 'draft' | 'active',
) {
  const location =
    state.locationLabel.trim() ||
    [state.city, state.postalCode, state.country].filter(Boolean).join(', ')
  const expires = new Date()
  expires.setDate(expires.getDate() + 30)
  const trade = PROJECT_TRADES.find((t) => t.id === state.tradeId)
  const subcategorySlugs = trade ? [trade.subcategorySlug] : []
  const deadline = mapDeadlineForDb(state)

  return {
    title: wizardTitleFromTrade(tradeLabel, state.city) || 'Project draft',
    description: state.description.trim() || 'Draft project',
    category_id: categoryId,
    listing_type: 'service_request' as const,
    price: state.budgetMax || state.budgetMin || null,
    currency: 'EUR',
    location: location || 'EU',
    contact_name: state.contactName.trim() || 'Customer',
    contact_phone: state.contactPhone.trim() || null,
    contact_email: state.contactEmail.trim() || null,
    author_id: userId,
    duration_days: 30,
    expires_at: expires.toISOString(),
    status,
    subcategory_slugs: subcategorySlugs,
    budget_min: state.budgetMin,
    budget_max: state.budgetMax,
    budget_band: state.budgetBand,
    timeline_option: deadline.timeline_option,
    deadline_type: deadline.deadline_type,
    deadline_at: deadline.deadline_at,
    urgency: deadline.urgency,
    preferred_language: state.preferredLanguage || null,
    wizard_completed: status === 'active',
    wizard_preferences: state.preferences,
    postal_code: state.postalCode.trim() || null,
    country_name: state.country.trim() || null,
    city_name: state.city.trim() || null,
    latitude: state.latitude,
    longitude: state.longitude,
    visibility_radius: 'country' as const,
  }
}

export async function saveProjectWizardDraftListing(
  userId: string,
  state: ProjectWizardState,
  tradeLabel: string,
): Promise<{ listingId: string } | { error: string }> {
  const categoryId = await resolveConstructionCategoryId()
  const payload = listingPayload(userId, state, tradeLabel, categoryId, 'draft')

  if (state.listingId) {
    const { error } = await supabase
      .from('listings')
      .update(payload as never)
      .eq('id', state.listingId)
      .eq('author_id', userId)
    if (error) {
      // Fallback without new columns
      if (/column|schema cache|draft/i.test(error.message)) {
        const { error: e2 } = await supabase
          .from('listings')
          .update({
            title: payload.title,
            description: payload.description,
            budget_min: payload.budget_min,
            budget_max: payload.budget_max,
            city_name: payload.city_name,
            country_name: payload.country_name,
            postal_code: payload.postal_code,
            latitude: payload.latitude,
            longitude: payload.longitude,
            wizard_completed: false,
          } as never)
          .eq('id', state.listingId)
          .eq('author_id', userId)
        if (e2) return { error: e2.message }
        return { listingId: state.listingId }
      }
      return { error: error.message }
    }
    return { listingId: state.listingId }
  }

  const { data, error } = await supabase
    .from('listings')
    .insert(payload as never)
    .select('id')
    .single()

  if (error || !data) {
    // If draft status not allowed, skip listing draft (local/remote draft table still works)
    if (/status|check|draft/i.test(error?.message || '')) {
      return { error: 'listing_draft_unsupported' }
    }
    return { error: error?.message || 'create_failed' }
  }
  return { listingId: (data as { id: string }).id }
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
  const payload = listingPayload(userId, state, tradeLabel, categoryId, 'active')
  const trade = PROJECT_TRADES.find((t) => t.id === state.tradeId)
  const subcategorySlugs = trade ? [trade.subcategorySlug] : []

  let listingId = state.listingId

  if (listingId) {
    const { error } = await supabase
      .from('listings')
      .update(payload as never)
      .eq('id', listingId)
      .eq('author_id', userId)
    if (error) {
      // Retry without newer columns
      const { error: e2 } = await supabase
        .from('listings')
        .update({
          title: payload.title,
          description: payload.description,
          status: 'active',
          budget_min: payload.budget_min,
          budget_max: payload.budget_max,
          deadline_type: payload.deadline_type,
          deadline_at: payload.deadline_at,
          urgency: payload.urgency,
          wizard_completed: true,
          postal_code: payload.postal_code,
          country_name: payload.country_name,
          city_name: payload.city_name,
          latitude: payload.latitude,
          longitude: payload.longitude,
          contact_name: payload.contact_name,
          contact_phone: payload.contact_phone,
          contact_email: payload.contact_email,
          subcategory_slugs: subcategorySlugs,
        } as never)
        .eq('id', listingId)
        .eq('author_id', userId)
      if (e2) {
        console.error('submitProjectWizard update:', e2)
        return { error: e2.message }
      }
    }
  } else {
    const { data: listing, error } = await supabase
      .from('listings')
      .insert(payload as never)
      .select('id')
      .single()

    if (error || !listing) {
      // Fallback insert without new columns
      const { data: listing2, error: e2 } = await supabase
        .from('listings')
        .insert({
          title: payload.title,
          description: payload.description,
          category_id: categoryId,
          listing_type: 'service_request',
          price: payload.price,
          currency: 'EUR',
          location: payload.location,
          contact_name: payload.contact_name,
          contact_phone: payload.contact_phone,
          contact_email: payload.contact_email,
          author_id: userId,
          duration_days: 30,
          expires_at: payload.expires_at,
          status: 'active',
          subcategory_slugs: subcategorySlugs,
          budget_min: payload.budget_min,
          budget_max: payload.budget_max,
          deadline_type: payload.deadline_type,
          deadline_at: payload.deadline_at,
          urgency: payload.urgency,
          preferred_language: payload.preferred_language,
          wizard_completed: true,
          postal_code: payload.postal_code,
          country_name: payload.country_name,
          city_name: payload.city_name,
          latitude: payload.latitude,
          longitude: payload.longitude,
          visibility_radius: 'country',
        } as never)
        .select('id')
        .single()
      if (e2 || !listing2) {
        console.error('submitProjectWizard:', error || e2)
        return { error: (e2 || error)?.message || 'create_failed' }
      }
      listingId = (listing2 as { id: string }).id
    } else {
      listingId = (listing as { id: string }).id
    }
  }

  for (const draft of state.files) {
    const uploaded = await uploadProjectFile(userId, listingId!, draft.file)
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

  await runMatchingForListing(listingId!, {
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

  await markWizardDraftPublished(userId, state.draftId, listingId!)

  return { listingId: listingId! }
}
