/** Злиття назв з БД (UA/DE) з канонічними англійськими ключами довідника. */

const COUNTRY_ALIASES: Record<string, string[]> = {
  Ukraine: ['Ukraine', 'Україна'],
  Poland: ['Poland', 'Польща'],
  Germany: ['Germany', 'Німеччина', 'Deutschland'],
  'Czech Republic': ['Czech Republic', 'Чехія', 'Czechia'],
  Slovakia: ['Slovakia', 'Словаччина'],
  Romania: ['Romania', 'Румунія'],
  Hungary: ['Hungary', 'Угорщина'],
  Austria: ['Austria', 'Австрія'],
  France: ['France', 'Франція'],
  Spain: ['Spain', 'Іспанія', 'España', 'Espana'],
  Italy: ['Italy', 'Італія'],
  'United Kingdom': ['United Kingdom', 'Великобританія', 'UK'],
}

const REGION_ALIASES: Record<string, Record<string, string>> = {
  Germany: {
    Bayern: 'Bavaria',
    Баварія: 'Bavaria',
    Bavaria: 'Bavaria',
    Hessen: 'Hessen',
    Гессен: 'Hessen',
    'Nordrhein-Westfalen': 'North Rhine-Westphalia',
    'Північний Рейн-Вестфалія': 'North Rhine-Westphalia',
    'Baden-Württemberg': 'Baden-Württemberg',
    Berlin: 'Berlin',
    Берлін: 'Berlin',
    'Niedersachsen': 'Niedersachsen',
    'Rheinland-Pfalz': 'Rheinland-Pfalz',
    'Sachsen-Anhalt': 'Saxony-Anhalt',
    'Schleswig-Holstein': 'Schleswig-Holstein',
    'Mecklenburg-Vorpommern': 'Mecklenburg-Vorpommern',
    Thüringen: 'Thuringia',
    Saarland: 'Saarland',
    Bremen: 'Bremen',
    Brandenburg: 'Brandenburg',
    Saxony: 'Saxony',
    Саксонія: 'Saxony',
  },
  Ukraine: {
    'Київська': 'Київська',
    'Kyiv Oblast': 'Київська',
    'Львівська': 'Львівська',
    'Lviv Oblast': 'Львівська',
    'Одеська': 'Одеська',
    'Odesa Oblast': 'Одеська',
    'Харківська': 'Харківська',
    'Kharkiv Oblast': 'Харківська',
    'Дніпропетровська': 'Дніпропетровська',
    'Dnipro Oblast': 'Дніпропетровська',
  },
}

export function canonicalCountryName(name: string): string {
  const trimmed = name?.trim()
  if (!trimmed) return trimmed
  for (const [canonical, aliases] of Object.entries(COUNTRY_ALIASES)) {
    if (canonical === trimmed || aliases.includes(trimmed)) return canonical
  }
  return trimmed
}

export function countryQueryNames(canonical: string): string[] {
  const aliases = COUNTRY_ALIASES[canonical]
  return aliases ? [...new Set([canonical, ...aliases])] : [canonical]
}

export function canonicalRegionName(country: string, region: string): string {
  const r = region?.trim() || 'Інші'
  const map = REGION_ALIASES[canonicalCountryName(country)]
  return map?.[r] ?? map?.[r.replace(/\s+/g, ' ')] ?? r
}
