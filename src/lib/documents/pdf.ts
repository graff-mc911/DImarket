/**
 * Generate a filled document PDF from form values (print HTML — same pattern as OSM / quotes).
 * Never invents legal clauses; prints user-entered fields + source disclaimer.
 */

import {
  formatGeneratedDocumentFooter,
  generatedDocumentFooterHtml,
} from '../officialSources/pdfMeta'

export type FilledDocumentPdfInput = {
  title: string
  jurisdiction: string
  sourceName: string
  sourceUrl: string
  version: string
  lastVerified: string | null
  templateNeedsLegalReview: boolean
  fields: Array<{ label: string; value: string }>
  needsReviewLabel: string
  disclaimerAccuracy: string
  disclaimerNotAdvice: string
}

export function buildFilledDocumentPdfHtml(input: FilledDocumentPdfInput): string {
  const rows = input.fields
    .filter((f) => f.value.trim())
    .map(
      (f) =>
        `<tr><th style="text-align:left;padding:6px 8px;border-bottom:1px solid #e5e5ea;width:32%">${escapeHtml(f.label)}</th><td style="padding:6px 8px;border-bottom:1px solid #e5e5ea;white-space:pre-wrap">${escapeHtml(f.value)}</td></tr>`,
    )
    .join('')

  const reviewBanner = input.templateNeedsLegalReview
    ? `<p style="background:#fff4e5;border:1px solid #f5c26b;padding:10px 12px;border-radius:8px;font-size:13px">${escapeHtml(input.needsReviewLabel)}</p>`
    : ''

  const meta = {
    version: input.version,
    jurisdiction: input.jurisdiction,
    sourceName: input.sourceName,
    sourceUrl: input.sourceUrl,
    lastVerified: input.lastVerified,
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(input.title)}</title>
<style>
  body { font-family: system-ui, -apple-system, Segoe UI, sans-serif; color:#1d1d1f; margin:24px; line-height:1.45; }
  h1 { font-size:22px; margin:0 0 8px; }
  table { width:100%; border-collapse:collapse; margin-top:16px; }
  .muted { color:#6e6e73; font-size:12px; }
  @media print { body { margin:12mm; } }
</style>
</head>
<body>
  <h1>${escapeHtml(input.title)}</h1>
  <p class="muted">${escapeHtml(input.jurisdiction)}</p>
  ${reviewBanner}
  <table>${rows || `<tr><td class="muted">—</td></tr>`}</table>
  <p style="margin-top:20px;font-size:12px;color:#6e6e73">${escapeHtml(input.disclaimerAccuracy)}</p>
  <p style="font-size:12px;color:#6e6e73">${escapeHtml(input.disclaimerNotAdvice)}</p>
  ${generatedDocumentFooterHtml(meta)}
  <script>window.onload=function(){try{window.print()}catch(e){}}</script>
</body>
</html>`
}

export function openFilledDocumentPdf(input: FilledDocumentPdfInput, filename: string): void {
  const html = buildFilledDocumentPdfHtml(input)
  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
    return
  }
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.html') ? filename : `${filename}.html`
  a.click()
  URL.revokeObjectURL(url)
}

export function filledDocumentFilename(title: string): string {
  const base = title.replace(/[^\w\-]+/g, '_').slice(0, 60) || 'document'
  return `${base}.pdf`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export { formatGeneratedDocumentFooter }
