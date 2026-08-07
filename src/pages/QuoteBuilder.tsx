import { useEffect, useMemo, useState } from 'react'
import {
  FileDown,
  Mail,
  Plus,
  Save,
  Send,
  Trash2,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { estimateQuoteLocally } from '../lib/bots/quote/estimate'
import { buildQuotePdfHtml } from '../lib/quotePdf'
import {
  calcQuoteTotals,
  draftFromQuoteRow,
  emailQuoteToCustomer,
  emptyQuoteDraft,
  fetchQuoteForApplication,
  generateAndStoreQuotePdf,
  newLine,
  notifyCustomerQuoteInApp,
  printQuotePdf,
  saveQuote,
  type QuoteDraft,
  type QuoteLineItem,
} from '../lib/quotes'

type ListingInfo = {
  id: string
  title: string
  city_name?: string | null
  description?: string | null
  contact_name?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  author_id?: string | null
  category?: { slug: string } | null
}

const field =
  'w-full rounded-xl border border-[#d2d2d7] bg-[#fafafa] px-3 py-2.5 text-[14px] text-[#1d1d1f] outline-none transition focus:border-[#1d1d1f] focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]'

export function QuoteBuilder({ applicationId }: { applicationId: string }) {
  const { user, profile } = useApp()
  const [listing, setListing] = useState<ListingInfo | null>(null)
  const [quoteId, setQuoteId] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [customerEmail, setCustomerEmail] = useState('')
  const [draft, setDraft] = useState<QuoteDraft>(emptyQuoteDraft())

  useEffect(() => {
    if (!user) return
    let cancelled = false
    void (async () => {
      const { data: appRaw } = await supabase
        .from('project_applications')
        .select(
          'id, listing_id, listing:listings(id, title, city_name, description, contact_name, contact_email, contact_phone, author_id, category:categories(slug))',
        )
        .eq('id', applicationId)
        .eq('professional_id', user.id)
        .maybeSingle()

      const app = appRaw as { listing_id: string; listing: ListingInfo | null } | null
      if (cancelled || !app?.listing) return

      const listingRow = app.listing
      setListing(listingRow)
      setCustomerEmail(listingRow.contact_email || '')

      const est = estimateQuoteLocally({
        categorySlug: listingRow.category?.slug || 'construction',
        city: listingRow.city_name || undefined,
        description: listingRow.description || undefined,
        currency: 'EUR',
      })
      const mid = Math.round((est.minPrice + est.maxPrice) / 2)

      const existing = await fetchQuoteForApplication(applicationId)
      if (cancelled) return

      if (existing) {
        setQuoteId(existing.id)
        setDraft(draftFromQuoteRow(existing))
      } else {
        setDraft({
          materials: [{ ...newLine('Materials estimate'), amount: Math.round(mid * 0.35) }],
          labor: [{ ...newLine('Labor estimate'), amount: Math.round(mid * 0.5) }],
          equipment: [{ ...newLine('Equipment / tools'), amount: Math.round(mid * 0.15) }],
          vatPercent: 20,
          discount: 0,
          currency: 'EUR',
          notes: est.explanation,
        })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [applicationId, user])

  const totals = useMemo(() => calcQuoteTotals(draft), [draft])

  const updateLine = (
    kind: 'materials' | 'labor' | 'equipment',
    id: string,
    patch: Partial<QuoteLineItem>,
  ) => {
    setDraft((d) => ({
      ...d,
      [kind]: d[kind].map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }))
  }

  const buildMeta = () => ({
    quoteNumber: quoteId ? `Q-${quoteId.slice(0, 8).toUpperCase()}` : 'DRAFT',
    projectTitle: listing?.title || 'Project',
    customerName: listing?.contact_name || undefined,
    customerEmail: customerEmail || listing?.contact_email || undefined,
    customerPhone: listing?.contact_phone || undefined,
    professionalName: profile?.full_name || 'Professional',
    professionalLocation: profile?.location || undefined,
    professionalPhone: profile?.phone || undefined,
    professionalEmail: user?.email || undefined,
    currency: draft.currency,
    notes: draft.notes,
  })

  const persist = async (status: 'draft' | 'sent', pdfUrl?: string | null) => {
    if (!user || !listing) return null
    const res = await saveQuote({
      applicationId,
      listingId: listing.id,
      professionalId: user.id,
      draft,
      status,
      quoteId,
      pdfUrl,
    })
    if ('error' in res) {
      setError(res.error)
      return null
    }
    setQuoteId(res.id)
    return res.id
  }

  const onSaveDraft = async () => {
    setBusy(true)
    setError(null)
    setNotice(null)
    const id = await persist('draft')
    setBusy(false)
    if (id) setNotice('Draft saved')
  }

  const onGeneratePdf = async () => {
    if (!user || !listing) return
    setBusy(true)
    setError(null)
    setNotice(null)
    const id = (await persist('draft')) || quoteId
    if (!id) {
      setBusy(false)
      return
    }
    const { html, pdfUrl } = await generateAndStoreQuotePdf({
      userId: user.id,
      quoteId: id,
      draft,
      meta: { ...buildMeta(), quoteNumber: `Q-${id.slice(0, 8).toUpperCase()}` },
    })
    if (pdfUrl) await persist('draft', pdfUrl)
    printQuotePdf(html)
    setBusy(false)
    setNotice(pdfUrl ? 'PDF ready — print or Save as PDF' : 'PDF opened for printing')
  }

  const onSendEmail = async () => {
    if (!user || !listing) return
    const email = customerEmail.trim()
    if (!email || !email.includes('@')) {
      setError('Enter a valid customer email')
      return
    }
    setBusy(true)
    setError(null)
    setNotice(null)

    const id = (await persist('sent')) || quoteId
    if (!id) {
      setBusy(false)
      return
    }

    const meta = { ...buildMeta(), quoteNumber: `Q-${id.slice(0, 8).toUpperCase()}` }
    const { html, pdfUrl } = await generateAndStoreQuotePdf({
      userId: user.id,
      quoteId: id,
      draft,
      meta,
    })
    await persist('sent', pdfUrl)

    const mailed = await emailQuoteToCustomer({
      quoteId: id,
      toEmail: email,
      customerName: listing.contact_name || undefined,
      projectTitle: listing.title,
      total: totals.total,
      currency: draft.currency,
      pdfUrl,
      html: buildQuotePdfHtml(draft, meta),
    })

    if (listing.author_id) {
      await notifyCustomerQuoteInApp({
        customerId: listing.author_id,
        listingId: listing.id,
        projectTitle: listing.title,
        total: totals.total,
      })
    }

    setBusy(false)
    if (!mailed.ok) {
      setError(
        mailed.error
          ? `Saved & notified in-app, but email failed: ${mailed.error}`
          : 'Saved, but email could not be sent (check RESEND_API_KEY)',
      )
      setNotice('Quote saved as sent')
      return
    }
    setNotice(`Quote emailed to ${email}`)
    window.setTimeout(() => navigateTo('/projects'), 1200)
  }

  /** Send binding quote in-app (no email required) → customer /project/:id/offers */
  const onSendInApp = async () => {
    if (!user || !listing) return
    setBusy(true)
    setError(null)
    setNotice(null)

    const id = (await persist('sent')) || quoteId
    if (!id) {
      setBusy(false)
      return
    }

    const meta = { ...buildMeta(), quoteNumber: `Q-${id.slice(0, 8).toUpperCase()}` }
    const { pdfUrl } = await generateAndStoreQuotePdf({
      userId: user.id,
      quoteId: id,
      draft,
      meta,
    })
    await persist('sent', pdfUrl)

    if (listing.author_id) {
      await notifyCustomerQuoteInApp({
        customerId: listing.author_id,
        listingId: listing.id,
        projectTitle: listing.title,
        total: totals.total,
      })
    }

    setBusy(false)
    setNotice('Quote sent — customer notified on ranked offers. Returning to leads…')
    window.setTimeout(() => navigateTo('/projects'), 1200)
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <button type="button" className="btn-primary" onClick={() => navigateTo('/login')}>
          Sign in
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-[70vh] bg-[#f5f5f7] pb-28">
      <div className="border-b border-[#e8e8ed] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl flex-wrap items-end justify-between gap-3 px-4 py-6 md:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
              Generate Quote
            </p>
            <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-[#1d1d1f]">
              Quote Builder
            </h1>
            <p className="mt-1 text-[14px] text-[#86868b]">
              {listing?.title || 'Loading project…'}
              {listing?.city_name ? ` · ${listing.city_name}` : ''}
            </p>
          </div>
          <button
            type="button"
            className="rounded-full border border-[#d2d2d7] bg-white px-4 py-2 text-[13px] font-semibold text-[#1d1d1f]"
            onClick={() => navigateTo('/projects')}
          >
            Back to projects
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6 md:px-6">
        {notice ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800">
            <p>{notice}</p>
            <button
              type="button"
              className="rounded-full bg-emerald-800 px-3 py-1.5 text-[12px] font-semibold text-white"
              onClick={() => navigateTo('/projects')}
            >
              Back to leads
            </button>
          </div>
        ) : null}
        {error ? (
          <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {error}
          </p>
        ) : null}

        <div className="space-y-4">
          <SectionCard
            title="Materials"
            lines={draft.materials}
            onAdd={() => setDraft((d) => ({ ...d, materials: [...d.materials, newLine()] }))}
            onChange={(id, patch) => updateLine('materials', id, patch)}
            onRemove={(id) =>
              setDraft((d) => ({ ...d, materials: d.materials.filter((l) => l.id !== id) }))
            }
          />
          <SectionCard
            title="Labor"
            lines={draft.labor}
            onAdd={() => setDraft((d) => ({ ...d, labor: [...d.labor, newLine()] }))}
            onChange={(id, patch) => updateLine('labor', id, patch)}
            onRemove={(id) =>
              setDraft((d) => ({ ...d, labor: d.labor.filter((l) => l.id !== id) }))
            }
          />
          <SectionCard
            title="Equipment"
            lines={draft.equipment}
            onAdd={() => setDraft((d) => ({ ...d, equipment: [...d.equipment, newLine()] }))}
            onChange={(id, patch) => updateLine('equipment', id, patch)}
            onRemove={(id) =>
              setDraft((d) => ({ ...d, equipment: d.equipment.filter((l) => l.id !== id) }))
            }
          />

          <div className="rounded-[22px] border border-[#e8e8ed] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
                  Discount (€)
                </span>
                <input
                  type="number"
                  min={0}
                  value={draft.discount}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, discount: Number(e.target.value) || 0 }))
                  }
                  className={field}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
                  VAT (%)
                </span>
                <input
                  type="number"
                  min={0}
                  value={draft.vatPercent}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, vatPercent: Number(e.target.value) || 0 }))
                  }
                  className={field}
                />
              </label>
            </div>

            <div className="mt-5 rounded-2xl bg-[#f5f5f7] p-4">
              <Row label="Materials" value={totals.materials} />
              <Row label="Labor" value={totals.labor} />
              <Row label="Equipment" value={totals.equipment} />
              <Row label="Subtotal" value={totals.subtotal} />
              {totals.discount > 0 ? <Row label="Discount" value={-totals.discount} /> : null}
              <Row label={`VAT (${draft.vatPercent}%)`} value={totals.vat} />
              <div className="mt-3 flex items-center justify-between border-t border-[#e8e8ed] pt-3">
                <span className="text-[15px] font-semibold text-[#1d1d1f]">Total</span>
                <span className="text-[24px] font-semibold tabular-nums tracking-tight text-[#1d1d1f]">
                  €{totals.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-[22px] border border-[#e8e8ed] bg-white p-5">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
                Notes
              </span>
              <textarea
                value={draft.notes}
                onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                rows={3}
                className={field}
                placeholder="Scope, timeline, warranty…"
              />
            </label>
            <label className="mt-4 block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
                Customer email
              </span>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className={field}
                placeholder="customer@email.com"
              />
            </label>
          </div>
        </div>

        <div className="sticky bottom-4 z-10 mt-6 flex flex-wrap gap-2 rounded-[20px] border border-[#e8e8ed] bg-white/95 p-3 shadow-lg backdrop-blur">
          <button
            type="button"
            disabled={busy}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[#d2d2d7] px-4 py-2.5 text-[13px] font-semibold text-[#1d1d1f] disabled:opacity-50 sm:flex-none"
            onClick={() => void onSaveDraft()}
          >
            <Save className="h-3.5 w-3.5" />
            Save
          </button>
          <button
            type="button"
            disabled={busy}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[#d2d2d7] px-4 py-2.5 text-[13px] font-semibold text-[#1d1d1f] disabled:opacity-50 sm:flex-none"
            onClick={() => void onGeneratePdf()}
          >
            <FileDown className="h-3.5 w-3.5" />
            PDF
          </button>
          <button
            type="button"
            disabled={busy}
            className="inline-flex flex-[2] items-center justify-center gap-1.5 rounded-full bg-[#1d1d1f] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-black disabled:opacity-50"
            onClick={() => void onSendInApp()}
            title="Save as sent and notify customer in-app"
          >
            <Send className="h-3.5 w-3.5" />
            Send to customer
          </button>
          <button
            type="button"
            disabled={busy}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#d2d2d7] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#1d1d1f] disabled:opacity-50"
            onClick={() => void onSendEmail()}
            title="Save as sent and email PDF"
          >
            <Mail className="h-3.5 w-3.5" />
            Email
          </button>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-1 text-[13px]">
      <span className="text-[#6e6e73]">{label}</span>
      <span className="font-semibold tabular-nums text-[#1d1d1f]">
        {value < 0 ? '−' : ''}€{Math.abs(value).toFixed(2)}
      </span>
    </div>
  )
}

function SectionCard({
  title,
  lines,
  onAdd,
  onChange,
  onRemove,
}: {
  title: string
  lines: QuoteLineItem[]
  onAdd: () => void
  onChange: (id: string, patch: Partial<QuoteLineItem>) => void
  onRemove: (id: string) => void
}) {
  return (
    <div className="rounded-[22px] border border-[#e8e8ed] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-[#1d1d1f]">{title}</h2>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1 rounded-full bg-[#f5f5f7] px-3 py-1.5 text-[12px] font-semibold text-[#1d1d1f] hover:bg-[#e8e8ed]"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>
      <ul className="space-y-2">
        {lines.map((line) => (
          <li key={line.id} className="flex gap-2">
            <input
              value={line.label}
              onChange={(e) => onChange(line.id, { label: e.target.value })}
              className={`${field} min-w-0 flex-1`}
              placeholder="Description"
            />
            <input
              type="number"
              value={line.amount}
              onChange={(e) => onChange(line.id, { amount: Number(e.target.value) || 0 })}
              className={`${field} w-28`}
              placeholder="€"
            />
            <button
              type="button"
              onClick={() => onRemove(line.id)}
              className="rounded-xl p-2.5 text-[#86868b] hover:bg-[#f5f5f7] hover:text-[#1d1d1f]"
              aria-label="Remove line"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
