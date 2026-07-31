import type { CompareProfessional } from './types'
import { buildCompareRows } from './fetchComparePros'

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Opens a print-ready comparison document (Save as PDF from the browser).
 */
export function exportComparePdf(pros: CompareProfessional[]) {
  if (!pros.length) return
  const rows = buildCompareRows(pros)
  const head = pros
    .map(
      (p) =>
        `<th><div style="font-size:14px;font-weight:700">${escapeHtml(p.fullName)}</div>
         <div style="font-size:11px;color:#86868b;font-weight:400;margin-top:4px">${escapeHtml(p.location || '')}</div></th>`,
    )
    .join('')

  const body = rows
    .map((row) => {
      const cells = row.values
        .map((v, i) => {
          const best = row.bestIndex === i
          return `<td style="${best ? 'background:#e8f5e9;font-weight:700' : ''}">${escapeHtml(String(v))}</td>`
        })
        .join('')
      return `<tr><th scope="row">${escapeHtml(row.label)}</th>${cells}</tr>`
    })
    .join('')

  const html = `<!doctype html><html><head><meta charset="utf-8"/><title>DImarket · Compare professionals</title>
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#1d1d1f;padding:28px;margin:0}
  h1{font-size:22px;margin:0 0 6px}
  .meta{color:#86868b;font-size:12px;margin:0 0 22px}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th,td{border:1px solid #e8e8ed;padding:10px 12px;text-align:left;vertical-align:top}
  thead th{background:#f5f5f7}
  tbody th{background:#fafafa;font-weight:600;width:140px}
  @media print{body{padding:12px} .no-print{display:none}}
</style></head><body>
  <h1>Professional comparison</h1>
  <p class="meta">DImarket · ${escapeHtml(new Date().toLocaleString())} · ${pros.length} professionals</p>
  <table>
    <thead><tr><th>Metric</th>${head}</tr></thead>
    <tbody>${body}</tbody>
  </table>
  <p class="meta no-print" style="margin-top:20px">Use your browser Print dialog → Save as PDF.</p>
  <script>window.onload=function(){window.print()}</script>
</body></html>`

  const win = window.open('', '_blank', 'noopener,noreferrer,width=1000,height=800')
  if (!win) return
  win.document.write(html)
  win.document.close()
}
