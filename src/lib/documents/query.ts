import { DOCUMENTS_CATALOG } from './catalog'
import { scoreDocumentForJurisdiction, type DocumentsJurisdiction } from './location'
import {
  documentSeoPath,
  type DocumentRecord,
  type DocumentsSubcategorySlug,
} from './types'

export function listDocuments(opts?: {
  subcategory?: DocumentsSubcategorySlug | null
  jurisdiction?: DocumentsJurisdiction | null
  query?: string
}): DocumentRecord[] {
  const q = opts?.query?.trim().toLowerCase() ?? ''
  let rows = [...DOCUMENTS_CATALOG]
  if (opts?.subcategory) {
    rows = rows.filter((d) => d.subcategory === opts.subcategory)
  }
  if (q) {
    rows = rows.filter((d) => {
      const hay = `${d.slug} ${d.id} ${d.jurisdiction} ${d.titleKey} ${d.descriptionKey}`.toLowerCase()
      return hay.includes(q) || d.slug.includes(q.replace(/\s+/g, '-'))
    })
  }
  if (opts?.jurisdiction) {
    const j = opts.jurisdiction
    rows = rows
      .map((d) => ({ d, score: scoreDocumentForJurisdiction(d, j) }))
      .filter((x) => x.score >= 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.d)
  }
  return rows
}

export function getDocumentByPathParts(
  countrySlug: string,
  cityOrSlug: string,
  maybeSlug?: string,
): DocumentRecord | null {
  const country = countrySlug.toLowerCase()
  if (maybeSlug) {
    const city = cityOrSlug
    const slug = maybeSlug
    return (
      DOCUMENTS_CATALOG.find(
        (d) =>
          d.countrySlug === country &&
          d.slug === slug &&
          d.city &&
          d.city.toLowerCase() === city.toLowerCase(),
      ) ??
      DOCUMENTS_CATALOG.find((d) => d.countrySlug === country && d.slug === slug && !d.city) ??
      null
    )
  }
  const slug = cityOrSlug
  return (
    DOCUMENTS_CATALOG.find((d) => d.countrySlug === country && d.slug === slug && !d.city) ??
    DOCUMENTS_CATALOG.find((d) => d.countrySlug === country && d.slug === slug) ??
    null
  )
}

export function getDocumentById(id: string): DocumentRecord | null {
  return DOCUMENTS_CATALOG.find((d) => d.id === id) ?? null
}

export function searchDocumentsForQuery(query: string, jurisdiction?: DocumentsJurisdiction | null) {
  return listDocuments({ query, jurisdiction }).slice(0, 20).map((d) => ({
    id: d.id,
    label: d.titleKey,
    path: documentSeoPath(d),
    jurisdiction: d.jurisdiction,
    status: d.status,
    subcategory: d.subcategory,
    document: d,
  }))
}

export { documentSeoPath }
