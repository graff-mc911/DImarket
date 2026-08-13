/**
 * Metadata block for generated PDFs / HTML printouts.
 * Legal templates must include version + source + last verified.
 */
export type GeneratedDocumentMeta = {
  documentName: string
  version: string
  jurisdiction: string
  generatedAt: Date | string
  sourceName?: string | null
  sourceUrl?: string | null
  lastVerifiedAt?: string | null
}

export function formatGeneratedDocumentFooter(meta: GeneratedDocumentMeta): string {
  const generated =
    typeof meta.generatedAt === 'string'
      ? meta.generatedAt
      : meta.generatedAt.toISOString().slice(0, 10)
  const verified = meta.lastVerifiedAt
    ? new Date(meta.lastVerifiedAt).toISOString().slice(0, 10)
    : '—'
  const lines = [
    meta.documentName,
    meta.jurisdiction,
    `Version ${meta.version}`,
    `Generated: ${generated}`,
    meta.sourceName ? `Source: ${meta.sourceName}` : null,
    `Source verified: ${verified}`,
  ].filter(Boolean)
  return lines.join('\n')
}

export function generatedDocumentFooterHtml(meta: GeneratedDocumentMeta): string {
  const text = formatGeneratedDocumentFooter(meta)
  const sourceLink = meta.sourceUrl
    ? `<p><a href="${meta.sourceUrl}" rel="noopener noreferrer">Official source</a></p>`
    : ''
  return `<footer class="dimarket-doc-meta"><pre>${text.replace(/</g, '&lt;')}</pre>${sourceLink}<p class="dimarket-doc-disclaimer">Informational template — not a substitute for legal advice. Current according to the linked official source as of the last verification date.</p></footer>`
}
