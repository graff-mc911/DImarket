import { supabase } from './supabase'
import type { Quote } from './types'

export type QuoteLineItem = {
  id: string
  label: string
  amount: number
}

export type QuoteDraft = {
  materials: QuoteLineItem[]
  labor: QuoteLineItem[]
  vatPercent: number
  discount: number
  currency: string
  notes: string
}

export function calcQuoteTotals(draft: QuoteDraft): { subtotal: number; total: number } {
  const mat = draft.materials.reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const lab = draft.labor.reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const subtotal = mat + lab
  const afterDiscount = Math.max(0, subtotal - (Number(draft.discount) || 0))
  const total = afterDiscount * (1 + (Number(draft.vatPercent) || 0) / 100)
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    total: Math.round(total * 100) / 100,
  }
}

export function newLine(label = ''): QuoteLineItem {
  return { id: crypto.randomUUID(), label, amount: 0 }
}

export async function saveQuote(input: {
  applicationId: string
  listingId: string
  professionalId: string
  draft: QuoteDraft
  status: 'draft' | 'sent'
  quoteId?: string
}): Promise<{ id: string } | { error: string }> {
  const { subtotal, total } = calcQuoteTotals(input.draft)
  const payload = {
    application_id: input.applicationId,
    listing_id: input.listingId,
    professional_id: input.professionalId,
    materials: input.draft.materials,
    labor: input.draft.labor,
    vat_percent: input.draft.vatPercent,
    discount: input.draft.discount,
    currency: input.draft.currency,
    subtotal,
    total,
    notes: input.draft.notes || null,
    status: input.status,
    updated_at: new Date().toISOString(),
  }

  if (input.quoteId) {
    const { data, error } = await supabase
      .from('quotes')
      .update(payload as never)
      .eq('id', input.quoteId)
      .select('id')
      .single()
    if (error || !data) return { error: error?.message || 'update_failed' }
    return { id: (data as { id: string }).id }
  }

  const { data, error } = await supabase
    .from('quotes')
    .insert(payload as never)
    .select('id')
    .single()
  if (error || !data) return { error: error?.message || 'create_failed' }
  return { id: (data as { id: string }).id }
}

export async function fetchQuoteForApplication(applicationId: string): Promise<Quote | null> {
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) {
    console.error('fetchQuoteForApplication:', error)
    return null
  }
  return data as Quote | null
}

/** Print-friendly PDF via browser print dialog */
export function printQuoteAsPdf(title: string): void {
  document.title = title
  window.print()
}
