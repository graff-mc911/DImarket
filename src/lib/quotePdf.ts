import type { QuoteDraft, QuoteLineItem } from './quotes'
import { supabase } from './supabase'

function draftTotals(draft: QuoteDraft) {
  const materials = draft.materials.reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const labor = draft.labor.reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const equipment = (draft.equipment || []).reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const subtotal = materials + labor + equipment
  const discount = Math.max(0, Number(draft.discount) || 0)
  const afterDiscount = Math.max(0, subtotal - discount)
  const vat = afterDiscount * ((Number(draft.vatPercent) || 0) / 100)
  const total = afterDiscount + vat
  const round = (n: number) => Math.round(n * 100) / 100
  return {
    subtotal: round(subtotal),
    total: round(total),
  }
}

export type QuotePdfMeta = {
  quoteNumber: string
  projectTitle: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  professionalName: string
  professionalLocation?: string
  professionalPhone?: string
  professionalEmail?: string
  currency: string
  notes?: string
  issuedAt?: string
}

function money(n: number, currency: string): string {
  const sym = currency === 'EUR' || !currency ? '€' : `${currency} `
  return `${sym}${n.toFixed(2)}`
}

function sectionHtml(title: string, lines: QuoteLineItem[], currency: string): string {
  if (!lines.length) return ''
  const rows = lines
    .filter((l) => l.label.trim() || l.amount)
    .map(
      (l) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;color:#1d1d1f;font-size:14px">${escapeHtml(l.label || '—')}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;font-size:14px;font-weight:600;font-variant-numeric:tabular-nums">${money(Number(l.amount) || 0, currency)}</td>
      </tr>`,
    )
    .join('')
  if (!rows) return ''
  return `
    <div style="margin-top:28px">
      <h3 style="margin:0 0 8px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#86868b;font-weight:700">${title}</h3>
      <table style="width:100%;border-collapse:collapse">${rows}</table>
    </div>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Beautiful printable quote HTML (save-as-PDF / email) */
export function buildQuotePdfHtml(draft: QuoteDraft, meta: QuotePdfMeta): string {
  const totals = draftTotals(draft)
  const issued = meta.issuedAt || new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const matSum = draft.materials.reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const labSum = draft.labor.reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const eqSum = (draft.equipment || []).reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const afterDiscount = Math.max(0, totals.subtotal - (Number(draft.discount) || 0))
  const vat = Math.round(((afterDiscount * (Number(draft.vatPercent) || 0)) / 100) * 100) / 100

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Quote ${escapeHtml(meta.quoteNumber)} — ${escapeHtml(meta.projectTitle)}</title>
<style>
  @page { margin: 18mm; }
  body { margin:0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; color:#1d1d1f; background:#fff; }
  .sheet { max-width:720px; margin:0 auto; padding:40px 32px; }
  @media print { .sheet { padding:0; } .no-print { display:none !important; } }
</style>
</head>
<body>
  <div class="sheet">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:24px;border-bottom:2px solid #1d1d1f;padding-bottom:20px">
      <div>
        <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#86868b">DImarket Quote</div>
        <h1 style="margin:6px 0 0;font-size:28px;letter-spacing:-0.03em">${escapeHtml(meta.projectTitle)}</h1>
        <p style="margin:8px 0 0;font-size:13px;color:#86868b">${escapeHtml(meta.quoteNumber)} · ${escapeHtml(issued)}</p>
      </div>
      <div style="text-align:right">
        <div style="font-size:15px;font-weight:700">${escapeHtml(meta.professionalName)}</div>
        ${meta.professionalLocation ? `<div style="font-size:12px;color:#86868b;margin-top:4px">${escapeHtml(meta.professionalLocation)}</div>` : ''}
        ${meta.professionalEmail ? `<div style="font-size:12px;color:#86868b">${escapeHtml(meta.professionalEmail)}</div>` : ''}
        ${meta.professionalPhone ? `<div style="font-size:12px;color:#86868b">${escapeHtml(meta.professionalPhone)}</div>` : ''}
      </div>
    </div>

    <div style="display:flex;gap:32px;margin-top:24px;flex-wrap:wrap">
      <div style="min-width:200px">
        <div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#86868b">Bill to</div>
        <div style="margin-top:6px;font-size:14px;font-weight:600">${escapeHtml(meta.customerName || 'Customer')}</div>
        ${meta.customerEmail ? `<div style="font-size:12px;color:#6e6e73">${escapeHtml(meta.customerEmail)}</div>` : ''}
        ${meta.customerPhone ? `<div style="font-size:12px;color:#6e6e73">${escapeHtml(meta.customerPhone)}</div>` : ''}
      </div>
    </div>

    ${sectionHtml('Materials', draft.materials, meta.currency)}
    ${sectionHtml('Labor', draft.labor, meta.currency)}
    ${sectionHtml('Equipment', draft.equipment || [], meta.currency)}

    <div style="margin-top:32px;margin-left:auto;max-width:280px">
      <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#6e6e73">
        <span>Materials</span><span>${money(matSum, meta.currency)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#6e6e73">
        <span>Labor</span><span>${money(labSum, meta.currency)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#6e6e73">
        <span>Equipment</span><span>${money(eqSum, meta.currency)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#6e6e73">
        <span>Subtotal</span><span>${money(totals.subtotal, meta.currency)}</span>
      </div>
      ${draft.discount > 0 ? `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#6e6e73"><span>Discount</span><span>−${money(Number(draft.discount) || 0, meta.currency)}</span></div>` : ''}
      <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#6e6e73">
        <span>VAT (${Number(draft.vatPercent) || 0}%)</span><span>${money(vat, meta.currency)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:14px 0 0;margin-top:8px;border-top:2px solid #1d1d1f;font-size:20px;font-weight:700;letter-spacing:-0.02em">
        <span>Total</span><span>${money(totals.total, meta.currency)}</span>
      </div>
    </div>

    ${meta.notes ? `<div style="margin-top:36px;padding:16px;border-radius:16px;background:#f5f5f7"><div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#86868b">Notes</div><p style="margin:8px 0 0;font-size:13px;line-height:1.5;color:#1d1d1f;white-space:pre-wrap">${escapeHtml(meta.notes)}</p></div>` : ''}

    <p style="margin-top:40px;font-size:11px;color:#86868b;text-align:center">Generated with DImarket · dimarket.app</p>
  </div>
  <script class="no-print">window.onload=function(){setTimeout(function(){window.print()},300)}</script>
</body>
</html>`
}

/** Open styled print window (browser Save as PDF) */
export function openQuotePdfPrint(html: string): void {
  const w = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1000')
  if (!w) {
    downloadQuoteHtml(html, 'quote.html')
    return
  }
  w.document.open()
  w.document.write(html)
  w.document.close()
}

export function downloadQuoteHtml(html: string, filename: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Upload printable HTML to Storage and return public URL */
export async function uploadQuotePdfDocument(
  userId: string,
  quoteId: string,
  html: string,
): Promise<string | null> {
  const path = `${userId}/${quoteId}/quote-${Date.now()}.html`
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const { error } = await supabase.storage.from('quote-pdfs').upload(path, blob, {
    contentType: 'text/html;charset=utf-8',
    upsert: true,
  })
  if (error) {
    console.error('uploadQuotePdfDocument:', error)
    const alt = await supabase.storage.from('project-files').upload(path, blob, {
      contentType: 'text/html;charset=utf-8',
      upsert: true,
    })
    if (alt.error) {
      console.error('uploadQuotePdfDocument fallback:', alt.error)
      return null
    }
    const { data } = supabase.storage.from('project-files').getPublicUrl(path)
    return data.publicUrl
  }
  const { data } = supabase.storage.from('quote-pdfs').getPublicUrl(path)
  return data.publicUrl
}
