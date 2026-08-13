import {
  formatGeneratedDocumentFooter,
  generatedDocumentFooterHtml,
  type GeneratedDocumentMeta,
} from './pdfMeta'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function markdownToHtml(md: string): string {
  const lines = md.split('\n')
  const out: string[] = []
  let inBlockquote = false

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (line.startsWith('> ')) {
      if (!inBlockquote) {
        out.push('<blockquote style="margin:12px 0;padding:12px 16px;border-left:4px solid #d2d2d7;background:#f5f5f7;font-size:13px;color:#6e6e73">')
        inBlockquote = true
      }
      out.push(`<p style="margin:4px 0">${escapeHtml(line.slice(2)).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>`)
      continue
    }
    if (inBlockquote) {
      out.push('</blockquote>')
      inBlockquote = false
    }
    if (line.startsWith('# ')) {
      out.push(`<h1 style="font-size:22px;font-weight:800;margin:0 0 12px">${escapeHtml(line.slice(2))}</h1>`)
    } else if (line.startsWith('## ')) {
      out.push(`<h2 style="font-size:16px;font-weight:700;margin:20px 0 8px">${escapeHtml(line.slice(3))}</h2>`)
    } else if (line.startsWith('- ')) {
      out.push(`<p style="margin:4px 0 4px 16px;font-size:14px;line-height:1.5">• ${escapeHtml(line.slice(2)).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>`)
    } else if (line === '---') {
      out.push('<hr style="border:none;border-top:1px solid #e8e8ed;margin:20px 0"/>')
    } else if (line.trim()) {
      out.push(`<p style="margin:8px 0;font-size:14px;line-height:1.6;color:#1d1d1f">${escapeHtml(line).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>')}</p>`)
    }
  }
  if (inBlockquote) out.push('</blockquote>')
  return out.join('\n')
}

export type LegalDocumentPdfInput = {
  title: string
  bodyMarkdown: string
  meta: GeneratedDocumentMeta
  disclaimerLines?: [string, string]
}

/** Printable HTML for legal document (browser Save as PDF). */
export function buildLegalDocumentPdfHtml(input: LegalDocumentPdfInput): string {
  const footerMeta = input.meta
  const disclaimer = input.disclaimerLines ?? [
    'Information is current according to the linked official source as of the last verification date.',
    'This document is an informational template and does not replace legal advice when the law requires individual review.',
  ]

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(input.title)}</title>
<style>
  @page { margin: 18mm; }
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif; color:#1d1d1f; background:#fff; }
  .sheet { max-width:720px; margin:0 auto; padding:40px 32px; }
  @media print { .sheet { padding:0; } .no-print { display:none !important; } }
  .dimarket-doc-meta { margin-top:40px;padding-top:16px;border-top:2px solid #1d1d1f;font-size:11px;color:#6e6e73; }
  .dimarket-doc-disclaimer { margin-top:8px;font-size:10px;line-height:1.5;color:#86868b; }
</style>
</head>
<body>
  <div class="sheet">
    <div style="border-bottom:2px solid #1d1d1f;padding-bottom:16px;margin-bottom:24px">
      <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#86868b">DImarket · Official document</div>
      <h1 style="margin:8px 0 0;font-size:26px;letter-spacing:-0.02em">${escapeHtml(input.title)}</h1>
      <p style="margin:6px 0 0;font-size:12px;color:#86868b">${escapeHtml(footerMeta.jurisdiction)} · Version ${escapeHtml(footerMeta.version)}</p>
    </div>
    <article>${markdownToHtml(input.bodyMarkdown)}</article>
    ${generatedDocumentFooterHtml(footerMeta)}
    <p class="dimarket-doc-disclaimer">${escapeHtml(disclaimer[0])}</p>
    <p class="dimarket-doc-disclaimer">${escapeHtml(disclaimer[1])}</p>
    <p style="margin-top:24px;font-size:10px;color:#86868b;text-align:center">Generated with DImarket · dimarket.app</p>
  </div>
  <script class="no-print">window.onload=function(){setTimeout(function(){window.print()},300)}</script>
</body>
</html>`
}

export function openLegalDocumentPdfPrint(html: string): void {
  const w = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1000')
  if (!w) {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'document.html'
    a.click()
    URL.revokeObjectURL(url)
    return
  }
  w.document.open()
  w.document.write(html)
  w.document.close()
}

export function legalDocumentPdfFilename(title: string, version: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
  return `${slug || 'document'}-v${version.replace(/[^a-z0-9.]+/gi, '-')}.html`
}

export { formatGeneratedDocumentFooter }
