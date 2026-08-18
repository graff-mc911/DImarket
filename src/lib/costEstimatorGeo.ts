const COUNTRY_MUL: Record<string, number> = {
  germany: 1.22,
  deutschland: 1.22,
  de: 1.22,
  austria: 1.2,
  österreich: 1.2,
  at: 1.2,
  switzerland: 1.45,
  schweiz: 1.45,
  ch: 1.45,
  netherlands: 1.25,
  nl: 1.25,
  france: 1.28,
  fr: 1.28,
  belgium: 1.2,
  be: 1.2,
  spain: 1.05,
  españa: 1.05,
  es: 1.05,
  portugal: 0.95,
  pt: 0.95,
  italy: 1.1,
  italia: 1.1,
  it: 1.1,
  poland: 0.78,
  polska: 0.78,
  pl: 0.78,
  ukraine: 0.55,
  україна: 0.55,
  ua: 0.55,
  czech: 0.85,
  'czech republic': 0.85,
  cz: 0.85,
  romania: 0.7,
  ro: 0.7,
  hungary: 0.75,
  hu: 0.75,
}

const CITY_MUL: Record<string, number> = {
  berlin: 1.22,
  munich: 1.28,
  münchen: 1.28,
  frankfurt: 1.24,
  hamburg: 1.2,
  darmstadt: 1.16,
  cologne: 1.18,
  köln: 1.18,
  warsaw: 1.08,
  warszawa: 1.08,
  kyiv: 0.72,
  київ: 0.72,
  madrid: 1.12,
  barcelona: 1.15,
  valencia: 1.05,
  alicante: 1.02,
  vienna: 1.2,
  wien: 1.2,
  amsterdam: 1.25,
  paris: 1.3,
  zurich: 1.5,
  zürich: 1.5,
  milan: 1.18,
  milano: 1.18,
  rome: 1.1,
  roma: 1.1,
  lisbon: 1.0,
  lisboa: 1.0,
  prague: 0.95,
  praha: 0.95,
}

function countryMul(country?: string): number {
  const key = (country || '').toLowerCase().trim()
  for (const [k, m] of Object.entries(COUNTRY_MUL)) {
    if (key === k || key.includes(k)) return m
  }
  return 1
}

function cityMul(city?: string): number {
  const key = (city || '').toLowerCase()
  for (const [k, m] of Object.entries(CITY_MUL)) {
    if (key.includes(k)) return m
  }
  return 1
}

export function estimatorGeoMultiplier(country?: string, city?: string): number {
  return countryMul(country) * cityMul(city)
}

/** Approximate VAT rate for reference estimates (not legal advice). */
export function vatRateForCountry(country?: string): number {
  const c = (country || '').toLowerCase()
  if (/switzerland|schweiz|\bch\b/.test(c)) return 0.081
  if (/luxembourg/.test(c)) return 0.17
  if (/germany|deutschland|\bde\b/.test(c)) return 0.19
  if (/ireland|\bie\b/.test(c)) return 0.23
  if (/denmark|danmark|sweden|sverige|norway|norge|finland/.test(c)) return 0.25
  if (/hungary|\bhu\b/.test(c)) return 0.27
  return 0.2
}
