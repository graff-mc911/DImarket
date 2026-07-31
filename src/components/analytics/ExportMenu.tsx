import { Download, FileSpreadsheet, FileText, Printer } from 'lucide-react'
import {
  exportCsv,
  exportExcel,
  exportPdfPrint,
  printAnalyticsElement,
  rowsFromKpis,
  type ExportColumn,
  type ExportRow,
} from '../../lib/analytics/export'

export function ExportMenu({
  filename,
  kpis,
  columns,
  rows,
  printRootId = 'analytics-print-root',
}: {
  filename: string
  kpis?: Record<string, unknown>
  columns?: ExportColumn[]
  rows?: ExportRow[]
  printRootId?: string
}) {
  const resolved = columns && rows ? { columns, rows } : rowsFromKpis(kpis || {})

  const onCsv = () => exportCsv(filename, resolved.columns, resolved.rows)
  const onExcel = () => exportExcel(filename, resolved.columns, resolved.rows)
  const onPdf = () => {
    const table = `<table><thead><tr>${resolved.columns
      .map((c) => `<th>${c.label}</th>`)
      .join('')}</tr></thead><tbody>${resolved.rows
      .map(
        (r) =>
          `<tr>${resolved.columns.map((c) => `<td>${r[c.key] ?? ''}</td>`).join('')}</tr>`,
      )
      .join('')}</tbody></table>`
    exportPdfPrint(`DImarket · ${filename}`, table)
  }
  const onPrint = () => {
    printAnalyticsElement(document.getElementById(printRootId))
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={onCsv}
        className="inline-flex items-center gap-1 rounded-full border border-[#d2d2d7] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#1d1d1f]"
      >
        <Download className="h-3.5 w-3.5" />
        CSV
      </button>
      <button
        type="button"
        onClick={onExcel}
        className="inline-flex items-center gap-1 rounded-full border border-[#d2d2d7] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#1d1d1f]"
      >
        <FileSpreadsheet className="h-3.5 w-3.5" />
        Excel
      </button>
      <button
        type="button"
        onClick={onPdf}
        className="inline-flex items-center gap-1 rounded-full border border-[#d2d2d7] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#1d1d1f]"
      >
        <FileText className="h-3.5 w-3.5" />
        PDF
      </button>
      <button
        type="button"
        onClick={onPrint}
        className="inline-flex items-center gap-1 rounded-full border border-[#d2d2d7] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#1d1d1f]"
      >
        <Printer className="h-3.5 w-3.5" />
        Print
      </button>
    </div>
  )
}
