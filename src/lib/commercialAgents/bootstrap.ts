import { upsertAgentProfile, upsertManufacturerProfile } from './api'
import { inferCoordsFromLocationText } from '../geoSearch'
import { supabase } from '../supabase'

/** After auth signup: seed manufacturer_profiles row (not a client profile). */
export async function bootstrapManufacturerAccount(input: {
  userId: string
  companyName: string
  location?: string | null
  country?: string | null
  website?: string | null
}): Promise<{ error: string | null }> {
  const coords = inferCoordsFromLocationText(input.location || input.country || '')
  if (coords) {
    await supabase
      .from('profiles')
      .update({
        service_latitude: coords.lat,
        service_longitude: coords.lon,
        location: input.location || input.country || null,
      } as never)
      .eq('id', input.userId)
  }

  const { error } = await upsertManufacturerProfile(input.userId, {
    company_name: input.companyName.trim() || 'Manufacturer',
    description: '',
    country: input.country || null,
    headquarters: input.location || null,
    website: input.website || null,
    categories: [],
    products: [],
    is_published: true,
  })
  return { error }
}

/** After auth signup: seed agent_profiles row (not a client profile). */
export async function bootstrapAgentAccount(input: {
  userId: string
  fullName: string
  location?: string | null
  country?: string | null
  city?: string | null
}): Promise<{ error: string | null }> {
  const coords = inferCoordsFromLocationText(input.location || [input.city, input.country].filter(Boolean).join(', '))
  if (coords) {
    await supabase
      .from('profiles')
      .update({
        service_latitude: coords.lat,
        service_longitude: coords.lon,
        location: input.location || null,
      } as never)
      .eq('id', input.userId)
  }

  const { error } = await upsertAgentProfile(input.userId, {
    full_name: input.fullName.trim() || 'Commercial Agent',
    description: '',
    country: input.country || null,
    city: input.city || null,
    categories: [],
    languages: [],
    current_manufacturers: [],
    available_for_new_brands: true,
    is_published: true,
  })
  return { error }
}
