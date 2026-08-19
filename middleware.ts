const OG: Record<string, { title: string; description: string }> = {
  uk: {
    title: 'DImarket — Маркетплейс для будівництва та ремонту',
    description: 'Знайдіть майстрів, розмістіть запит і отримайте відповіді напряму. Безкоштовно для клієнтів.',
  },
  en: {
    title: 'DImarket — Marketplace for Construction & Renovation',
    description: 'Find contractors, post a job and get replies directly. Free for clients.',
  },
  de: {
    title: 'DImarket — Marktplatz für Bau & Renovierung',
    description: 'Handwerker finden, Auftrag veröffentlichen, direkte Antworten. Kostenlos für Auftraggeber.',
  },
  pl: {
    title: 'DImarket — Marketplace dla budownictwa i remontów',
    description: 'Znajdź fachowców, opublikuj zlecenie i odbierz oferty bezpośrednio. Bezpłatnie.',
  },
  fr: {
    title: 'DImarket — Marketplace pour la construction et rénovation',
    description: 'Trouvez des artisans, publiez un projet et recevez des réponses. Gratuit.',
  },
  es: {
    title: 'DImarket — Marketplace para construcción y renovación',
    description: 'Encuentra profesionales, publica un pedido y recibe respuestas directamente. Gratis.',
  },
  it: {
    title: 'DImarket — Marketplace per edilizia e ristrutturazione',
    description: 'Trova artigiani, pubblica una richiesta e ricevi risposte direttamente. Gratuito.',
  },
  ru: {
    title: 'DImarket — Маркетплейс для строительства и ремонта',
    description: 'Найдите мастеров, разместите запрос и получите ответы напрямую. Бесплатно.',
  },
  pt: {
    title: 'DImarket — Marketplace para construção e renovação',
    description: 'Encontre profissionais, publique um pedido e receba respostas diretamente. Gratuito.',
  },
  cs: {
    title: 'DImarket — Tržiště pro stavebníctví a renovace',
    description: 'Najděte řemeslníky, zveřejněte zakázku a získte odpovědi přímo. Zdarma.',
  },
  sk: {
    title: 'DImarket — Trhovisko pre stavebníctvo a rekonštrukcie',
    description: 'Nájdite remeselnikov, zverejnite zákazku a dostávajte odpovede priamo. Zadarmo.',
  },
  hu: {
    title: 'DImarket — Piacтér építkezéshez és felújításhoz',
    description: 'Találjon szakembereket, tegyen fel megbízást és kapjon válaszokat közvetlenül. Ingyenes.',
  },
  ro: {
    title: 'DImarket — Marketplace pentru construcții și renovări',
    description: 'Găsiți meșteri, publicați o cerere și primiți răspunsuri direct. Gratuit.',
  },
  bg: {
    title: 'DImarket — Пазар за строителство и ремонти',
    description: 'Намерете майстори, публикувайте заявка и получавайте отговори директно. Безплатно.',
  },
  hr: {
    title: 'DImarket — Tržnica za gradnju i renoviranje',
    description: 'Pronađite majstore, objavite zahtjev i primajte odgovore izravno. Besplatno.',
  },
  sl: {
    title: 'DImarket — Tržnica za gradnjo in prenovo',
    description: 'Poiščite mojstre, objavite zahtevo in prejemajte odgovore neposredno. Brezplačno.',
  },
  sr: {
    title: 'DImarket — Тржиште за градњу и реновирање',
    description: 'Пронађите мајсторе, поставите захтев и добијајте одговоре директно. Бесплатно.',
  },
  nl: {
    title: 'DImarket — Marktplaats voor bouw en renovatie',
    description: 'Vind aannemers, plaats een opdracht en ontvang rechtstreeks antwoorden. Gratis.',
  },
  tr: {
    title: 'DImarket — İnşaat ve Renovasyon Pazaryeri',
    description: 'Usta bulun, iş talebi yayınlayın ve doğrudan yanıt alın. Müşteriler için ücretsiz.',
  },
  ar: {
    title: 'DImarket — سوق للبناء والتجديد',
    description: 'ابحث عن المقاولين، انشر طلبًا واحصل على ردود مباشرة. مجاني للعملاء.',
  },
  ja: {
    title: 'DImarket — 建設・リノベーションのマーケットプレイス',
    description: '職人を探し、依頼を投稿して直接返答を受け取る。クライアント無料。',
  },
  zh: {
    title: 'DImarket — 建筑与装修市场平台',
    description: '寻找承包商，发布工作请求，直接获取回复。客户免费使用。',
  },
  kk: {
    title: 'DImarket — Құрылыс және жөндеуге арналған нарық',
    description: 'Шеберлер табыңыз, тапсырыс беріңіз және тікелей жауап алыңыз. Тегін.',
  },
}

const FALLBACK = 'uk'

function getLang(req: Request): string {
  const al = req.headers.get('accept-language') || ''
  const codes = al
    .split(',')
    .map((s: string) => s.split(';')[0].trim().toLowerCase().split('-')[0])
    .filter(Boolean)
  for (const c of codes) {
    if (OG[c]) return c
  }
  return FALLBACK
}

function buildMeta(lang: string): string {
  const { title, description } = OG[lang]
  return `<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="https://dimarket.app/og-image.png">
<meta property="og:url" content="https://dimarket.app/">
<meta property="og:type" content="website">
<meta name="description" content="${description}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="https://dimarket.app/og-image.png">
<title>${title}</title>`
}

export default async function middleware(req: Request) {
  const { pathname } = new URL(req.url)
  if (pathname !== '/') return

  const ua = (req.headers.get('user-agent') || '').toLowerCase()
  const isCrawler =
    ua.includes('whatsapp') ||
    ua.includes('telegrambot') ||
    ua.includes('twitterbot') ||
    ua.includes('facebookexternalhit') ||
    ua.includes('signal') ||
    ua.includes('slackbot') ||
    ua.includes('linkedinbot') ||
    ua.includes('viber') ||
    ua.includes('vkshare') ||
    ua.includes('discordbot') ||
    ua.includes('googlebot') ||
    ua.includes('bingbot') ||
    ua.includes('headlesschrome') ||
    ua.includes('prerender') ||
    !ua.includes('mozilla')

  if (!isCrawler) return

  const indexUrl = new URL('/index.html', req.url)
  const res = await fetch(indexUrl.toString())
  if (!res.ok) return

  let html = await res.text()
  const lang = getLang(req)

  html = html
    .replace(/<meta\s+property="og:[^"]*"[^>]*>/gi, '')
    .replace(/<meta\s+property="twitter:[^"]*"[^>]*>/gi, '')
    .replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, '')
    .replace(/<meta\s+name="description"[^>]*>/gi, '')
    .replace(/<title>[^<]*<\/title>/gi, '')
    .replace('<head>', `<head>${buildMeta(lang)}`)

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, s-maxage=300, stale-while-revalidate=600',
      vary: 'Accept-Language',
    },
  })
}

export const config = {
  matcher: ['/'],
}
