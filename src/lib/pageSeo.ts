/**
 * Lightweight document head helpers for SPA SEO pages.
 */

export type PageSeoInput = {
  title: string
  description: string
  canonicalPath: string
  ogType?: string
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

const SITE_ORIGIN = 'https://dimarket.app'

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
}

function upsertJsonLd(data: Record<string, unknown> | Record<string, unknown>[]) {
  const id = 'dimarket-jsonld'
  let el = document.getElementById(id) as HTMLScriptElement | null
  if (!el) {
    el = document.createElement('script')
    el.id = id
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

export function applyPageSeo(input: PageSeoInput): () => void {
  const prevTitle = document.title
  const canonical = `${SITE_ORIGIN}${input.canonicalPath.startsWith('/') ? input.canonicalPath : `/${input.canonicalPath}`}`

  document.title = input.title
  upsertMeta('name', 'description', input.description)
  upsertMeta('property', 'og:title', input.title)
  upsertMeta('property', 'og:description', input.description)
  upsertMeta('property', 'og:type', input.ogType ?? 'website')
  upsertMeta('property', 'og:url', canonical)
  upsertMeta('property', 'og:site_name', 'DImarket')
  upsertMeta('name', 'twitter:card', 'summary_large_image')
  upsertMeta('name', 'twitter:title', input.title)
  upsertMeta('name', 'twitter:description', input.description)
  upsertLink('canonical', canonical)

  if (input.jsonLd) upsertJsonLd(input.jsonLd)

  return () => {
    document.title = prevTitle
    const jsonLd = document.getElementById('dimarket-jsonld')
    jsonLd?.remove()
  }
}
