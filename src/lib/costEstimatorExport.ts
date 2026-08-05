/**
 * Export cost estimates to CSV / printable PDF HTML.
 */
import { formatEuro } from './costEstimator'
import type { EstimatorState, FullCostEstimate, PricingTierId } from './costEstimatorTypes'

export function estimateToCsv(estimate: FullCostEstimate, state: EstimatorState): string {
  const lines: string[] = []
  lines.push('Section,Item,Quantity,Unit,Economy,Standard,Premium')
  lines.push(
    `Summary,Grand total,,,${estimate.totals.economy.grandTotal},${estimate.totals.standard.grandTotal},${estimate.totals.premium.grandTotal}`,
  )
  for (const b of estimate.breakdown) {
    lines.push(
      `Breakdown,${csv(b.label)},,,${b.amountEconomy},${b.amountStandard},${b.amountPremium}`,
    )
  }
  for (const m of estimate.materials) {
    lines.push(
      `Material,${csv(m.name)},${m.quantity},${csv(m.unit)},${m.unitPriceEconomy},${m.unitPriceStandard},${m.unitPricePremium}`,
    )
  }
  for (const s of estimate.specialists) {
    lines.push(`Specialist,${csv(s.label)},${s.laborHours},hours,,,`)
  }
  for (const t of estimate.timeline) {
    lines.push(`Timeline,${csv(t.label)},${t.daysMin}-${t.daysMax},days,,,`)
  }
  lines.push(`Meta,Project type,${csv(estimate.tradeLabel)},,,,`)
  lines.push(`Meta,Area,${state.measurements.areaSqm},m2,,,`)
  lines.push(
    `Meta,Location,${csv(state.location.locationLabel || state.location.city)},,,,`,
  )
  lines.push(`Meta,Disclaimer,${csv(estimate.disclaimer)},,,,`)
  return lines.join('\n')
}

function csv(v: string) {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`
  return v
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Excel-friendly: same CSV with BOM */
export function downloadExcelCsv(filename: string, content: string) {
  const blob = new Blob(['\ufeff' + content], {
    type: 'application/vnd.ms-excel;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.replace(/\.csv$/i, '.xls')
  a.click()
  URL.revokeObjectURL(url)
}

export function openEstimatePdfPrint(
  estimate: FullCostEstimate,
  state: EstimatorState,
  tier: PricingTierId = 'standard',
) {
  const totals = estimate.totals[tier]
  const html = `<!doctype html><html><head><meta charset="utf-8"/><title>DImarket Cost Estimate</title>
  <style>
    body{font-family:system-ui,sans-serif;color:#1d1d1f;padding:32px;max-width:800px;margin:0 auto}
    h1{font-size:22px;margin:0 0 8px} .muted{color:#6e6e73;font-size:13px}
    table{width:100%;border-collapse:collapse;margin:16px 0;font-size:13px}
    th,td{border-bottom:1px solid #e8e8ed;padding:8px;text-align:left}
    th{color:#86868b;font-size:11px;text-transform:uppercase}
    .total{font-size:20px;font-weight:700}
    .badge{display:inline-block;background:#f5f5f7;border-radius:999px;padding:4px 10px;font-size:11px;font-weight:600}
  </style></head><body>
  <p class="badge">DImarket · Reference estimate</p>
  <h1>${escapeHtml(estimate.tradeLabel)} — ${escapeHtml(state.location.city || 'Project')}</h1>
  <p class="muted">${escapeHtml(estimate.disclaimer)}</p>
  <p class="muted">${escapeHtml(state.description).slice(0, 400)}</p>
  <p class="total">${tier.toUpperCase()}: ${formatEuro(totals.grandTotal)}</p>
  <p class="muted">Economy ${formatEuro(estimate.totals.economy.grandTotal)} · Standard ${formatEuro(estimate.totals.standard.grandTotal)} · Premium ${formatEuro(estimate.totals.premium.grandTotal)}</p>
  <h2>Breakdown</h2>
  <table><thead><tr><th>Item</th><th>Economy</th><th>Standard</th><th>Premium</th></tr></thead><tbody>
  ${estimate.breakdown
    .map(
      (b) =>
        `<tr><td>${escapeHtml(b.label)}</td><td>${formatEuro(b.amountEconomy)}</td><td>${formatEuro(b.amountStandard)}</td><td>${formatEuro(b.amountPremium)}</td></tr>`,
    )
    .join('')}
  </tbody></table>
  <h2>Materials</h2>
  <table><thead><tr><th>Material</th><th>Qty</th><th>Unit</th><th>Std unit price</th></tr></thead><tbody>
  ${estimate.materials
    .map(
      (m) =>
        `<tr><td>${escapeHtml(m.name)}</td><td>${m.quantity}</td><td>${escapeHtml(m.unit)}</td><td>${formatEuro(m.unitPriceStandard)}</td></tr>`,
    )
    .join('')}
  </tbody></table>
  <h2>Specialists</h2>
  <ul>${estimate.specialists.map((s) => `<li>${escapeHtml(s.label)} (~${s.laborHours}h)</li>`).join('')}</ul>
  <h2>Timeline</h2>
  <p>${estimate.totalDaysMin}–${estimate.totalDaysMax} days · Est. completion ${new Date(estimate.estimatedCompletionIso).toLocaleDateString()}</p>
  <ul>${estimate.timeline.map((t) => `<li>${escapeHtml(t.label)}: ${t.daysMin}–${t.daysMax} days</li>`).join('')}</ul>
  <script>window.onload=()=>window.print()</script>
  </body></html>`
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(html)
  w.document.close()
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
