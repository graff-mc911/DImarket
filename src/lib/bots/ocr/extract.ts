import type { OcrExtracted } from '../types'

/** Локальний парсер рахунків з тексту (fallback без Vision API) */
export function extractInvoiceFromText(text: string): OcrExtracted {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const joined = text

  const amountMatch = joined.match(
    /(?:total|сума|разом|sum|amount)[:\s]*([€$£]?\s*[\d\s.,]+)/i,
  )
  const vatMatch = joined.match(/(?:vat|пдв|tax id|інн)[:\s#]*([A-Z0-9-]+)/i)
  const invMatch = joined.match(/(?:invoice|рахунок|фактура|№|#)\s*([A-Z0-9-/]+)/i)
  const dateMatch = joined.match(/(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/)

  let totalAmount: number | undefined
  if (amountMatch) {
    const n = parseFloat(amountMatch[1].replace(/[^\d.,]/g, '').replace(',', '.'))
    if (Number.isFinite(n)) totalAmount = n
  }

  let currency: string | undefined
  if (/€|eur/i.test(joined)) currency = 'EUR'
  else if (/\$|usd/i.test(joined)) currency = 'USD'
  else if (/₴|uah|грн/i.test(joined)) currency = 'UAH'

  const companyName = lines.find((l) => l.length > 3 && l.length < 80 && !/invoice|total/i.test(l))

  return {
    companyName: companyName?.slice(0, 120),
    invoiceDate: dateMatch?.[1],
    vatNumber: vatMatch?.[1],
    totalAmount,
    currency,
    invoiceNumber: invMatch?.[1],
  }
}
