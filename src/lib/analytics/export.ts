export type ExportColumn = { key: string; label: string }

export type ExportRow = Record<string, string | number | null | undefined>

function escapeCsv(v: unknown): string {
  const s = v == null ? '' : String(v)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function toCsv(columns: ExportColumn[], rows: ExportRow[]): string {
  const header = columns.map((c) => escapeCsv(c.label)).join(',')
  const body = rows
    .map((row) => columns.map((c) => escapeCsv(row[c.key])).join(','))
    .join('\n')
  return `${header}\n${body}`
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportCsv(filename: string, columns: ExportColumn[], rows: ExportRow[]) {
  const csv = `\uFEFF${toCsv(columns, rows)}`
  downloadBlob(filename.endsWith('.csv') ? filename : `${filename}.csv`, new Blob([csv], { type: 'text/csv;charset=utf-8' }))
}

/** Excel-friendly UTF-8 CSV (.xls opens in Excel without extra deps). */
export function exportExcel(filename: string, columns: ExportColumn[], rows: ExportRow[]) {
  const csv = `\uFEFF${toCsv(columns, rows)}`
  const name = filename.replace(/\.(csv|xlsx|xls)$/i, '')
  downloadBlob(
    `${name}.xls`,
    new Blob([csv], { type: 'application/vnd.ms-excel;charset=utf-8' }),
  )
}

export function exportPdfPrint(title: string, htmlBody: string) {
  const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700')
  if (!win) return
  win.document.write(`<!doctype html><html><head><title>${title}</title>
<style>
  body{font-family:system-ui,-apple-system,sans-serif;color:#1d1d1f;padding:24px}
  h1{font-size:20px;margin:0 0 8px}
  p.meta{color:#86868b;font-size:12px;margin:0 0 20px}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th,td{border:1px solid #e8e8ed;padding:8px;text-align:left}
  th{background:#f5f5f7}
  @media print{body{padding:0}}
</style></head><body>
  <h1>${title}</h1>
  <p class="meta">DImarket Analytics · ${new Date().toLocaleString()}</p>
  ${htmlBody}
  <script>window.onload=()=>{window.print()}</script>
</body></html>`)
  win.document.close()
}

export function printAnalyticsElement(el: HTMLElement | null) {
  if (!el) {
    window.print()
    return
  }
  const win = window.open('', '_blank', 'noopener,noreferrer,width=1000,height=800')
  if (!win) {
    window.print()
    return
  }
  win.document.write(`<!doctype html><html><head><title>DImarket Analytics</title>
<style>
  body{font-family:system-ui,-apple-system,sans-serif;color:#1d1d1f;padding:16px;background:#fff}
  *{box-sizing:border-box}
</style></head><body>${el.innerHTML}
<script>window.onload=()=>{window.print()}</script></body></html>`)
  win.document.close()
}

export function rowsFromKpis(kpis: Record<string, unknown>): {
  columns: ExportColumn[]
  rows: ExportRow[]
} {
  const columns: ExportColumn[] = [
    { key: 'metric', label: 'Metric' },
    { key: 'value', label: 'Value' },
  ]
  const rows = Object.entries(kpis).map(([metric, value]) => ({
    metric,
    value: value == null ? '' : String(value),
  }))
  return { columns, rows }
}
