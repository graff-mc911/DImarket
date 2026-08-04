export interface LocationSuggestion {
  name: string
  displayName: string
  country?: string
  postalCode?: string
  lat?: number
  lon?: number
  placeId?: string
}

export async function getCurrentLocation(): Promise<{ city: string; country: string } | null> {
  const detailed = await getCurrentLocationDetailed()
  if (!detailed?.city) return null
  return { city: detailed.city, country: detailed.country }
}

export type CurrentLocationDetailed = {
  city: string
  country: string
  region?: string
  province?: string
  postalCode?: string
  lat: number
  lon: number
}

export async function getCurrentLocationDetailed(): Promise<CurrentLocationDetailed | null> {
  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 10000,
        enableHighAccuracy: false,
      })
    })

    const { latitude, longitude } = position.coords

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`,
    )

    const data = await response.json()
    const address = data.address ?? {}

    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.suburb ||
      ''
    const country = address.country || ''
    const region = address.state || address.region || ''
    const province = address.province || address.county || address.state_district || ''

    if (!city && !country) return null

    return {
      city,
      country,
      region: region || undefined,
      province: province || undefined,
      postalCode: address.postcode || undefined,
      lat: latitude,
      lon: longitude,
    }
  } catch (error) {
    console.error('Error getting location:', error)
    return null
  }
}

export async function searchLocations(query: string): Promise<LocationSuggestion[]> {
  if (!query || query.length < 2) {
    return []
  }

  // Defense in depth: never geocode known profession/service keywords.
  // Import lazily to avoid circular deps with locationAutocomplete.
  const { isServiceKeyword } = await import('./serviceTaxonomy')
  if (isServiceKeyword(query)) {
    return []
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=8&accept-language=en`
    )

    const data = await response.json()

    return data.map((item: any) => ({
      name: item.address?.city ||
            item.address?.town ||
            item.address?.village ||
            item.address?.municipality ||
            item.name,
      displayName: item.display_name,
      country: item.address?.country || undefined,
      postalCode: item.address?.postcode || undefined,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    })).filter((item: LocationSuggestion) => item.name)
  } catch (error) {
    console.error('Error searching locations:', error)
    return []
  }
}
