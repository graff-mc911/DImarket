import { supabase } from './supabase'
import { createNotification } from './notifications/notifications'
import type { Quote } from './types'
import {
  buildQuotePdfHtml,
  openQuotePdfPrint,
  uploadQuotePdfDocument,
  type QuotePdfMeta,
} from './quotePdf'

export type QuoteLineItem = {
  id: string
  label: string
  amount: number
}

export type QuoteDraft = {
  materials: QuoteLineItem[]
  labor: QuoteLineItem[]
  equipment: QuoteLineItem[]
  vatPercent: number
  discount: number
  currency: string
  notes: string
}

export type QuoteTotals = {
  materials: number
  labor: number
  equipment: number
  subtotal: number
  discount: number
  afterDiscount: number
  vat: number
  total: number
}

export function calcQuoteTotals(draft: QuoteDraft): QuoteTotals {
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
    materials: round(materials),
    labor: round(labor),
    equipment: round(equipment),
    subtotal: round(subtotal),
    discount: round(discount),
    afterDiscount: round(afterDiscount),
    vat: round(vat),
    total: round(total),
  }
}

export function newLine(label = ''): QuoteLineItem {
  return { id: crypto.randomUUID(), label, amount: 0 }
}

export function emptyQuoteDraft(): QuoteDraft {
  return {
    materials: [newLine('Materials')],
    labor: [newLine('Labor')],
    equipment: [newLine('Equipment')],
    vatPercent: 20,
    discount: 0,
    currency: 'EUR',
    notes: '',
  }
}

function parseLines(raw: unknown): QuoteLineItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    const row = item as Partial<QuoteLineItem>
    return {
      id: row.id || crypto.randomUUID(),
      label: String(row.label || ''),
      amount: Number(row.amount) || 0,
    }
  })
}

/** Load equipment from column or from materials tagged items */
export function draftFromQuoteRow(row: Quote): QuoteDraft {
  const equipmentCol = (row as Quote & { equipment?: unknown }).equipment
  let equipment = parseLines(equipmentCol)
  let materials = parseLines(row.materials)

  // Legacy: equipment embedded in materials with [Equipment] prefix
  if (!equipment.length) {
    const tagged = materials.filter((l) => l.label.startsWith('[Equipment]'))
    if (tagged.length) {
      equipment = tagged.map((l) => ({
        ...l,
        label: l.label.replace(/^\[Equipment\]\s*/, ''),
      }))
      materials = materials.filter((l) => !l.label.startsWith('[Equipment]'))
    }
  }

  return {
    materials: materials.length ? materials : [newLine()],
    labor: parseLines(row.labor).length ? parseLines(row.labor) : [newLine()],
    equipment: equipment.length ? equipment : [newLine()],
    vatPercent: Number(row.vat_percent) || 20,
    discount: Number(row.discount) || 0,
    currency: row.currency || 'EUR',
    notes: row.notes || '',
  }
}

export async function saveQuote(input: {
  applicationId: string
  listingId: string
  professionalId: string
  draft: QuoteDraft
  status: 'draft' | 'sent'
  quoteId?: string
  pdfUrl?: string | null
}): Promise<{ id: string } | { error: string }> {
  const totals = calcQuoteTotals(input.draft)
  const basePayload = {
    application_id: input.applicationId,
    listing_id: input.listingId,
    professional_id: input.professionalId,
    materials: input.draft.materials,
    labor: input.draft.labor,
    equipment: input.draft.equipment,
    vat_percent: input.draft.vatPercent,
    discount: input.draft.discount,
    currency: input.draft.currency,
    subtotal: totals.subtotal,
    total: totals.total,
    notes: input.draft.notes || null,
    status: input.status,
    updated_at: new Date().toISOString(),
    ...(input.pdfUrl ? { pdf_url: input.pdfUrl } : {}),
  }

  const trySave = async (payload: Record<string, unknown>) => {
    if (input.quoteId) {
      return supabase
        .from('quotes')
        .update(payload as never)
        .eq('id', input.quoteId)
        .select('id')
        .single()
    }
    return supabase.from('quotes').insert(payload as never).select('id').single()
  }

  let { data, error } = await trySave(basePayload)

  // Fallback if equipment column missing
  if (error && /equipment/i.test(error.message || '')) {
    const mergedMaterials = [
      ...input.draft.materials,
      ...input.draft.equipment.map((l) => ({
        ...l,
        label: l.label.startsWith('[Equipment]') ? l.label : `[Equipment] ${l.label}`,
      })),
    ]
    const fallback = { ...basePayload, materials: mergedMaterials }
    delete (fallback as { equipment?: unknown }).equipment
    ;({ data, error } = await trySave(fallback))
  }

  if (error || !data) return { error: error?.message || 'save_failed' }
  const quoteId = (data as { id: string }).id
  if (input.status === 'sent') {
    await markListingComparingOffers(input.listingId)
  }
  return { id: quoteId }
}

/** Move listing into offers-comparison stage (does not overwrite hire/PM). */
export async function markListingComparingOffers(listingId: string): Promise<void> {
  try {
    const { data } = await supabase
      .from('listings')
      .select('pipeline_stage, hired_professional_id')
      .eq('id', listingId)
      .maybeSingle()
    const row = data as {
      pipeline_stage?: string | null
      hired_professional_id?: string | null
    } | null
    if (row?.hired_professional_id) return
    const stage = row?.pipeline_stage || ''
    if (stage === 'in_progress' || stage === 'completed' || stage === 'offers') return
    await supabase
      .from('listings')
      .update({
        pipeline_stage: 'offers',
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', listingId)
  } catch {
    /* column may be missing */
  }
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

export async function generateAndStoreQuotePdf(opts: {
  userId: string
  quoteId: string
  draft: QuoteDraft
  meta: QuotePdfMeta
}): Promise<{ html: string; pdfUrl: string | null }> {
  const html = buildQuotePdfHtml(opts.draft, opts.meta)
  const pdfUrl = await uploadQuotePdfDocument(opts.userId, opts.quoteId, html)
  if (pdfUrl) {
    await supabase
      .from('quotes')
      .update({ pdf_url: pdfUrl, updated_at: new Date().toISOString() } as never)
      .eq('id', opts.quoteId)
  }
  return { html, pdfUrl }
}

export function printQuotePdf(html: string): void {
  openQuotePdfPrint(html)
}

export async function emailQuoteToCustomer(opts: {
  quoteId: string
  toEmail: string
  customerName?: string
  projectTitle: string
  total: number
  currency: string
  pdfUrl?: string | null
  html?: string
}): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke('send-quote-email', {
    body: {
      quote_id: opts.quoteId,
      to_email: opts.toEmail,
      customer_name: opts.customerName,
      project_title: opts.projectTitle,
      total: opts.total,
      currency: opts.currency,
      pdf_url: opts.pdfUrl,
      html: opts.html,
    },
  })

  if (error) {
    console.error('emailQuoteToCustomer:', error)
    return { ok: false, error: error.message }
  }
  const payload = data as { ok?: boolean; error?: string } | null
  if (payload && payload.ok === false) {
    return { ok: false, error: payload.error || 'email_failed' }
  }
  return { ok: true }
}

export async function notifyCustomerQuoteInApp(opts: {
  customerId: string
  listingId: string
  projectTitle: string
  total: number
}): Promise<void> {
  await createNotification({
    userId: opts.customerId,
    type: 'quote',
    title: 'New quote received',
    body: `You received a quote of €${opts.total.toFixed(2)} for “${opts.projectTitle}”. Compare ranked offers.`,
    linkPath: `/project/${opts.listingId}/offers`,
    referenceType: 'listing',
    referenceId: opts.listingId,
  })
}
