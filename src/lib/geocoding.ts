export interface LocationSuggestion {
  name: string
  displayName: string
  lat?: number
  lon?: number
}

export async function getCurrentLocation(): Promise<{ city: string; country: string } | null> {
  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 10000,
        enableHighAccuracy: false,
      })
    })

    const { latitude, longitude } = position.coords

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=uk`
    )

    const data = await response.json()

    const city = data.address?.city ||
                 data.address?.town ||
                 data.address?.village ||
                 data.address?.municipality ||
                 ''
    const country = data.address?.country || ''

    if (city) {
      return { city, country }
    }

    return null
  } catch (error) {
    console.error('Error getting location:', error)
    return null
  }
}

export async function searchLocations(query: string): Promise<LocationSuggestion[]> {
  if (!query || query.length < 2) {
    return []
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ua&addressdetails=1&limit=5&accept-language=uk`
    )

    const data = await response.json()

    return data.map((item: any) => ({
      name: item.address?.city ||
            item.address?.town ||
            item.address?.village ||
            item.name,
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    })).filter((item: LocationSuggestion) => item.name)
  } catch (error) {
    console.error('Error searching locations:', error)
    return []
  }
}
