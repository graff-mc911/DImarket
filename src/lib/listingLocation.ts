/** Parse "City, Region, Country" as used in profiles and Telegram listings. */
export function parseListingLocation(location: string): {
  city: string
  region: string
  country: string
} | null {
  const parts = location.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length < 2) return null
  return {
    city: parts[0],
    country: parts[parts.length - 1],
    region: parts.length >= 3 ? parts.slice(1, -1).join(', ') : 'Інші',
  }
}

export function listingLocationMatches(filter: string, listingLocation: string): boolean {
  const f = filter.trim().toLowerCase()
  if (!f) return true
  const loc = (listingLocation || '').toLowerCase()
  if (loc.includes(f)) return true

  const parsed = parseListingLocation(listingLocation)
  if (!parsed) return loc.includes(f)

  const city = parsed.city.toLowerCase()
  const region = parsed.region.toLowerCase()
  const country = parsed.country.toLowerCase()

  return (
    city.includes(f) ||
    f.includes(city) ||
    region.includes(f) ||
    country.includes(f)
  )
}
