import { useEffect, useMemo, useState } from 'react'
import { Plus, Printer, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { estimateQuoteLocally } from '../lib/bots/quote/estimate'
import {
  calcQuoteTotals,
  fetchQuoteForApplication,
  newLine,
  printQuoteAsPdf,
  saveQuote,
  type QuoteDraft,
  type QuoteLineItem,
} from '../lib/quotes'

export function QuoteBuilder({ applicationId }: { applicationId: string }) {
  const { user } = useApp()
  const [listingId, setListingId] = useState<string | null>(null)
  const [listingTitle, setListingTitle] = useState('')
  const [quoteId, setQuoteId] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [draft, setDraft] = useState<QuoteDraft>({
    materials: [newLine('Materials')],
    labor: [newLine('Labor')],
    vatPercent: 20,
    discount: 0,
    currency: 'EUR',
    notes: '',
  })

  useEffect(() => {
    if (!user) return
    let cancelled = false
    void (async () => {
      const { data: appRaw } = await supabase
        .from('project_applications')
        .select('id, listing_id, listing:listings(id, title, city_name, description, category:categories(slug))')
        .eq('id', applicationId)
        .maybeSingle()

      const app = appRaw as {
        listing_id: string
        listing: {
          id: string
          title: string
          city_name?: string
          description?: string
          category?: { slug: string } | null
        } | null
      } | null

      if (cancelled || !app) return
      const listing = app.listing
      setListingId(app.listing_id)
      setListingTitle(listing?.title || 'Project')

      const est = estimateQuoteLocally({
        categorySlug: listing?.category?.slug || 'construction',
        city: listing?.city_name || undefined,
        description: listing?.description,
        currency: 'EUR',
      })
      const mid = Math.round((est.minPrice + est.maxPrice) / 2)
      setDraft((d) => ({
        ...d,
        materials: [{ ...newLine('Materials estimate'), amount: Math.round(mid * 0.4) }],
        labor: [{ ...newLine('Labor estimate'), amount: Math.round(mid * 0.6) }],
        notes: est.explanation,
      }))

      const existing = await fetchQuoteForApplication(applicationId)
      if (existing) {
        setQuoteId(existing.id)
        setDraft({
          materials: (existing.materials as QuoteLineItem[]) || [],
          labor: (existing.labor as QuoteLineItem[]) || [],
          vatPercent: Number(existing.vat_percent) || 20,
          discount: Number(existing.discount) || 0,
          currency: existing.currency || 'EUR',
          notes: existing.notes || '',
        })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [applicationId, user])

  const totals = useMemo(() => calcQuoteTotals(draft), [draft])

  const updateLine = (
    kind: 'materials' | 'labor',
    id: string,
    patch: Partial<QuoteLineItem>,
  ) => {
    setDraft((d) => ({
      ...d,
      [kind]: d[kind].map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }))
  }

  const persist = async (status: 'draft' | 'sent') => {
    if (!user || !listingId) return
    setBusy(true)
    setNotice(null)
    const res = await saveQuote({
      applicationId,
      listingId,
      professionalId: user.id,
      draft,
      status,
      quoteId,
    })
    setBusy(false)
    if ('error' in res) {
      setNotice(res.error)
      return
    }
    setQuoteId(res.id)
    setNotice(status === 'sent' ? 'Quote sent' : 'Draft saved')
  }

  if (!user) {
    return (
      <div className="py-16 text-center">
        <button type="button" className="btn-primary" onClick={() => navigateTo('/login')}>
          Sign in
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl py-6 pb-24 print:max-w-none">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ink-900)]">Quote builder</h1>
          <p className="text-sm text-[var(--ink-600)]">{listingTitle}</p>
        </div>
        <button type="button" className="btn-secondary text-sm" onClick={() => navigateTo('/leads')}>
          Back to leads
        </button>
      </div>

      {notice && (
        <p className="mb-4 rounded-sm border border-[#067d62]/30 bg-[#e7f8f1] px-3 py-2 text-sm text-[#067d62] print:hidden">
          {notice}
        </p>
      )}

      <div id="quote-print-root" className="amazon-section-card space-y-6 p-5 md:p-6">
        <Section
          title="Materials"
          lines={draft.materials}
          onAdd={() => setDraft((d) => ({ ...d, materials: [...d.materials, newLine()] }))}
          onChange={(id, patch) => updateLine('materials', id, patch)}
          onRemove={(id) =>
            setDraft((d) => ({ ...d, materials: d.materials.filter((l) => l.id !== id) }))
          }
        />
        <Section
          title="Labor"
          lines={draft.labor}
          onAdd={() => setDraft((d) => ({ ...d, labor: [...d.labor, newLine()] }))}
          onChange={(id, patch) => updateLine('labor', id, patch)}
          onRemove={(id) => setDraft((d) => ({ ...d, labor: d.labor.filter((l) => l.id !== id) }))}
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs font-bold">
            VAT %
            <input
              type="number"
              value={draft.vatPercent}
              onChange={(e) => setDraft((d) => ({ ...d, vatPercent: Number(e.target.value) || 0 }))}
              className="mt-1 w-full rounded-sm border border-[#888c8c] px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-bold">
            Discount €
            <input
              type="number"
              value={draft.discount}
              onChange={(e) => setDraft((d) => ({ ...d, discount: Number(e.target.value) || 0 }))}
              className="mt-1 w-full rounded-sm border border-[#888c8c] px-3 py-2 text-sm"
            />
          </label>
          <div className="rounded-sm bg-[#f7fafa] p-3 text-sm">
            <p>Subtotal: €{totals.subtotal.toFixed(2)}</p>
            <p className="text-lg font-bold">Total: €{totals.total.toFixed(2)}</p>
          </div>
        </div>

        <label className="block text-xs font-bold">
          Notes
          <textarea
            value={draft.notes}
            onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
            rows={3}
            className="mt-1 w-full rounded-sm border border-[#888c8c] px-3 py-2 text-sm"
          />
        </label>

        <div className="rounded-sm border border-dashed border-[#d5d9d9] p-3 text-xs text-[var(--ink-500)] print:hidden">
          Digital signature & email delivery — coming next. Export PDF via print for now.
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 print:hidden">
        <button type="button" disabled={busy} className="btn-secondary text-sm" onClick={() => void persist('draft')}>
          Save draft
        </button>
        <button type="button" disabled={busy} className="btn-primary text-sm" onClick={() => void persist('sent')}>
          Send quote
        </button>
        <button
          type="button"
          className="btn-secondary inline-flex items-center gap-1.5 text-sm"
          onClick={() => printQuoteAsPdf(`Quote — ${listingTitle}`)}
        >
          <Printer className="h-4 w-4" />
          Export PDF
        </button>
      </div>
    </div>
  )
}

function Section({
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
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--ink-700)]">{title}</h2>
        <button type="button" onClick={onAdd} className="inline-flex items-center gap-1 text-xs font-semibold text-[#007185] print:hidden">
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
              className="min-w-0 flex-1 rounded-sm border border-[#888c8c] px-3 py-2 text-sm"
              placeholder="Description"
            />
            <input
              type="number"
              value={line.amount}
              onChange={(e) => onChange(line.id, { amount: Number(e.target.value) || 0 })}
              className="w-28 rounded-sm border border-[#888c8c] px-3 py-2 text-sm"
            />
            <button type="button" onClick={() => onRemove(line.id)} className="p-2 text-[var(--ink-500)] print:hidden">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
