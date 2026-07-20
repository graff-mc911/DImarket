/**
 * Location autocomplete: Google Places when VITE_GOOGLE_MAPS_API_KEY is set,
 * otherwise OpenStreetMap Nominatim.
 */
import { searchLocations, type LocationSuggestion } from './geocoding'

declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          AutocompleteService: new () => {
            getPlacePredictions: (
              req: { input: string; types?: string[] },
              cb: (preds: Array<{ description: string; place_id: string }> | null, status: string) => void,
            ) => void
          }
          PlacesService: new (el: HTMLElement) => {
            getDetails: (
              req: { placeId: string; fields: string[] },
              cb: (place: GooglePlace | null, status: string) => void,
            ) => void
          }
        }
      }
    }
  }
}

type GooglePlace = {
  address_components?: Array<{ long_name: string; short_name: string; types: string[] }>
  formatted_address?: string
  geometry?: { location?: { lat: () => number; lng: () => number } }
}

let googleScriptPromise: Promise<boolean> | null = null

export function getGoogleMapsApiKey(): string {
  return (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim() || ''
}

export function loadGoogleMapsPlaces(): Promise<boolean> {
  const key = getGoogleMapsApiKey()
  if (!key) return Promise.resolve(false)
  if (window.google?.maps?.places) return Promise.resolve(true)
  if (googleScriptPromise) return googleScriptPromise

  googleScriptPromise = new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-dimarket-gmaps]')
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(window.google?.maps?.places)))
      return
    }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`
    script.async = true
    script.dataset.dimarketGmaps = '1'
    script.onload = () => resolve(Boolean(window.google?.maps?.places))
    script.onerror = () => resolve(false)
    document.head.appendChild(script)
  })
  return googleScriptPromise
}

function componentOf(place: GooglePlace, type: string): string {
  const c = place.address_components?.find((x) => x.types.includes(type))
  return c?.long_name || ''
}

export async function autocompleteLocations(query: string): Promise<LocationSuggestion[]> {
  if (!query || query.trim().length < 2) return []

  const ready = await loadGoogleMapsPlaces()
  if (ready && window.google?.maps?.places) {
    return new Promise((resolve) => {
      const service = new window.google!.maps.places.AutocompleteService()
      service.getPlacePredictions({ input: query, types: ['geocode'] }, (preds, status) => {
        if (status !== 'OK' || !preds?.length) {
          void searchLocations(query).then(resolve)
          return
        }
        resolve(
          preds.slice(0, 6).map((p) => ({
            name: p.description.split(',')[0]?.trim() || p.description,
            displayName: p.description,
            placeId: p.place_id,
          })) as LocationSuggestion[],
        )
      })
    })
  }

  return searchLocations(query)
}

export async function resolveLocationDetails(
  suggestion: LocationSuggestion & { placeId?: string },
): Promise<LocationSuggestion> {
  const placeId = (suggestion as { placeId?: string }).placeId
  if (!placeId || !window.google?.maps?.places) return suggestion

  return new Promise((resolve) => {
    const div = document.createElement('div')
    const service = new window.google!.maps.places.PlacesService(div)
    service.getDetails(
      { placeId, fields: ['address_component', 'formatted_address', 'geometry'] },
      (place, status) => {
        if (status !== 'OK' || !place) {
          resolve(suggestion)
          return
        }
        const city =
          componentOf(place, 'locality') ||
          componentOf(place, 'postal_town') ||
          componentOf(place, 'administrative_area_level_2') ||
          suggestion.name
        resolve({
          name: city,
          displayName: place.formatted_address || suggestion.displayName,
          country: componentOf(place, 'country') || suggestion.country,
          postalCode: componentOf(place, 'postal_code') || suggestion.postalCode,
          lat: place.geometry?.location?.lat(),
          lon: place.geometry?.location?.lng(),
        })
      },
    )
  })
}
