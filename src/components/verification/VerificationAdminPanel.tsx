import { useEffect, useState } from 'react'
import {
  Check,
  ExternalLink,
  FileText,
  Loader2,
  MessageSquareWarning,
  RefreshCw,
  X,
} from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { TrustBadges } from '../MatchScoreBadge'
import {
  adminReviewVerification,
  docTypeLabel,
  listPendingVerifications,
  listRecentVerificationReviews,
  listVerificationDocuments,
  listVerificationHistory,
  type PendingVerificationRow,
  type ReviewAction,
  type VerificationDocument,
  type VerificationReview,
} from '../../lib/verification/verification'

export function VerificationAdminPanel() {
  const { user, t } = useApp()
  const [rows, setRows] = useState<PendingVerificationRow[]>([])
  const [history, setHistory] = useState<
    Array<VerificationReview & { verification?: { profile_id: string; business_name: string | null } | null }>
  >([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [docs, setDocs] = useState<VerificationDocument[]>([])
  const [itemHistory, setItemHistory] = useState<VerificationReview[]>([])
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selected = rows.find((r) => r.id === selectedId) ?? null

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [pending, recent] = await Promise.all([
        listPendingVerifications(),
        listRecentVerificationReviews(30),
      ])
      setRows(pending)
      setHistory(recent)
      if (selectedId && !pending.some((p) => p.id === selectedId)) {
        setSelectedId(pending[0]?.id ?? null)
      } else if (!selectedId && pending[0]) {
        setSelectedId(pending[0].id)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    if (!selectedId) {
      setDocs([])
      setItemHistory([])
      return
    }
    void Promise.all([
      listVerificationDocuments(selectedId),
      listVerificationHistory(selectedId),
    ]).then(([d, h]) => {
      setDocs(d)
      setItemHistory(h)
    })
  }, [selectedId])

  const review = async (action: ReviewAction) => {
    if (!user || !selectedId) return
    if (action === 'request_info' && !notes.trim()) {
      setError(t('verification.requestInfoNotesRequired'))
      return
    }
    setBusy(true)
    setError(null)
    const ok = await adminReviewVerification(selectedId, user.id, action, notes.trim() || undefined)
    setBusy(false)
    if (!ok) {
      setError(t('verification.error'))
      return
    }
    setNotes('')
    await load()
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#86868b]">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t('common.loading')}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-[#1d1d1f]">{t('verification.adminTitle')}</h3>
          <p className="text-xs text-[#86868b]">
            {rows.length} pending · Approve / Reject / Request documents
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium text-[#1d1d1f] hover:bg-black/[0.03]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!rows.length ? (
        <p className="rounded-xl border border-[#e8e8ed] bg-white px-4 py-8 text-center text-sm text-[#86868b]">
          {t('verification.adminEmpty')}
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
          <ul className="space-y-2">
            {rows.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(row.id)
                    setNotes(row.review_notes || '')
                  }}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                    selectedId === row.id
                      ? 'border-[#1d1d1f] bg-[#1d1d1f] text-white'
                      : 'border-[#e8e8ed] bg-white hover:border-black/20'
                  }`}
                >
                  <p className="truncate text-sm font-semibold">
                    {row.profile?.full_name || row.profile_id.slice(0, 8)}
                  </p>
                  <p
                    className={`truncate text-[11px] ${
                      selectedId === row.id ? 'text-white/70' : 'text-[#86868b]'
                    }`}
                  >
                    {row.business_name || row.profile?.email || '—'}
                  </p>
                  <p
                    className={`mt-1 text-[10px] font-bold uppercase ${
                      selectedId === row.id ? 'text-amber-200' : 'text-amber-700'
                    }`}
                  >
                    {row.status}
                  </p>
                </button>
              </li>
            ))}
          </ul>

          {selected ? (
            <div className="space-y-4 rounded-2xl border border-[#e8e8ed] bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-[#1d1d1f]">
                    {selected.profile?.full_name || selected.profile_id}
                  </p>
                  <p className="text-xs text-[#86868b]">
                    {selected.profile?.email} · {selected.profile?.phone || 'No phone'} ·{' '}
                    {selected.profile?.location || '—'}
                  </p>
                  <div className="mt-2">
                    <TrustBadges source={selected.profile} size="sm" />
                  </div>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold uppercase text-amber-800">
                  {selected.status}
                </span>
              </div>

              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <Info label="Business" value={selected.business_name} />
                <Info label="VAT" value={selected.vat_number} />
                <Info label="Address" value={selected.address_line} />
                <Info
                  label="City / Country"
                  value={[selected.address_city, selected.address_postal_code, selected.address_country]
                    .filter(Boolean)
                    .join(', ')}
                />
                <Info
                  label="Submitted"
                  value={
                    selected.submitted_at
                      ? new Date(selected.submitted_at).toLocaleString()
                      : null
                  }
                />
              </dl>

              <div>
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#86868b]">
                  {t('verification.documents')}
                </p>
                {docs.length === 0 ? (
                  <p className="text-sm text-[#86868b]">No documents uploaded</p>
                ) : (
                  <ul className="space-y-2">
                    {docs.map((doc) => (
                      <li
                        key={doc.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#f5f5f7] px-3 py-2.5"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <FileText className="h-4 w-4 shrink-0 text-[#86868b]" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[#1d1d1f]">
                              {docTypeLabel(doc.doc_type)}
                            </p>
                            <p className="truncate text-[11px] text-[#86868b]">
                              {doc.file_name || doc.storage_path}
                            </p>
                          </div>
                        </div>
                        {doc.signed_url ? (
                          <a
                            href={doc.signed_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1d1d1f]"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Open
                          </a>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#86868b]">
                  {t('verification.reviewNotes')}
                </span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder={t('verification.reviewNotesPlaceholder')}
                  className="mt-1 w-full rounded-xl border border-[#d2d2d7] bg-[#fafafa] px-3 py-2.5 text-sm outline-none focus:border-[#1d1d1f]"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void review('approve')}
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                  {t('verification.approve')}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void review('request_info')}
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-900 disabled:opacity-50"
                >
                  <MessageSquareWarning className="h-3.5 w-3.5" />
                  {t('verification.requestInfo')}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void review('reject')}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-4 py-2 text-xs font-bold text-red-600 disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" />
                  {t('verification.reject')}
                </button>
              </div>

              {itemHistory.length > 0 ? (
                <div>
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#86868b]">
                    {t('verification.history')}
                  </p>
                  <ul className="space-y-1.5">
                    {itemHistory.map((h) => (
                      <li key={h.id} className="rounded-lg border border-[#f0f0f2] px-3 py-2 text-xs">
                        <div className="flex justify-between gap-2">
                          <span className="font-semibold capitalize">{h.action.replace('_', ' ')}</span>
                          <span className="text-[#86868b]">
                            {new Date(h.created_at).toLocaleString()}
                          </span>
                        </div>
                        {h.notes ? <p className="mt-0.5 text-[#86868b]">{h.notes}</p> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      {history.length > 0 ? (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-[#1d1d1f]">
            {t('verification.recentHistory')}
          </h4>
          <ul className="max-h-64 space-y-1.5 overflow-y-auto rounded-xl border border-[#e8e8ed] bg-white p-3">
            {history.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f5f5f7] py-2 text-xs last:border-0">
                <span className="font-medium capitalize text-[#1d1d1f]">
                  {h.action.replace('_', ' ')}
                  {h.verification?.business_name
                    ? ` · ${h.verification.business_name}`
                    : ''}
                </span>
                <span className="text-[#86868b]">{new Date(h.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl bg-[#f5f5f7] px-3 py-2">
      <dt className="text-[10px] font-bold uppercase tracking-wide text-[#86868b]">{label}</dt>
      <dd className="mt-0.5 text-[#1d1d1f]">{value || '—'}</dd>
    </div>
  )
}
