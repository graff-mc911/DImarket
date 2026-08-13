import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  History,
  Loader2,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Upload,
  XCircle,
} from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import {
  invokeOfficialSourcesMonitor,
  listLegalDocuments,
  listOfficialSources,
  listSourceChanges,
  publishDocumentVersion,
  rollbackDocumentVersion,
  createDocumentDraftVersion,
  updateSourceChangeStatus,
  type DocumentVersionRow,
  type LegalDocumentRow,
  type OfficialSourceRow,
  type SourceChangeRow,
} from '../../lib/officialSources/api'
import { canRollbackToVersion, isAutoDraftVersion } from '../../lib/officialSources'
import { DocumentFreshnessBadge } from './DocumentFreshnessBadge'
import { LegalMarkdownEditor } from './LegalMarkdownEditor'
import { LineDiffView } from './LineDiffView'

function statusDot(status: string) {
  if (status === 'verified') return 'bg-emerald-500'
  if (status === 'needs_review' || status === 'changed' || status === 'needs_research') {
    return 'bg-amber-500'
  }
  if (status === 'outdated' || status === 'unavailable') return 'bg-rose-500'
  return 'bg-[#86868b]'
}

function CreateDraftVersionForm({
  doc,
  onRefresh,
}: {
  doc: LegalDocumentRow
  onRefresh: () => Promise<void>
}) {
  const { t } = useApp()
  const [open, setOpen] = useState(false)
  const [versionNumber, setVersionNumber] = useState('')
  const [bodyMarkdown, setBodyMarkdown] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!versionNumber.trim() || !bodyMarkdown.trim()) return
    setBusy(true)
    try {
      await createDocumentDraftVersion({
        documentId: doc.id,
        versionNumber: versionNumber.trim(),
        bodyMarkdown: bodyMarkdown.trim(),
        changeSummary: t('osm.admin.draftSummary'),
      })
      setOpen(false)
      setVersionNumber('')
      setBodyMarkdown('')
      await onRefresh()
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 text-xs font-semibold text-[#007185] hover:underline"
      >
        {t('osm.admin.createDraft')}
      </button>
    )
  }

  return (
    <div className="mt-3 space-y-2 rounded-xl border border-[#e8e8ed] bg-[#fafafa] p-3">
      <p className="text-xs font-semibold text-[#1d1d1f]">{t('osm.admin.createDraftTitle')}</p>
      <input
        type="text"
        value={versionNumber}
        onChange={(e) => setVersionNumber(e.target.value)}
        placeholder={t('osm.admin.versionNumberPlaceholder')}
        className="w-full rounded-lg border border-[#d2d2d7] px-2 py-1.5 text-xs"
      />
      <LegalMarkdownEditor
        value={bodyMarkdown}
        onChange={setBodyMarkdown}
        rows={8}
        placeholder={t('osm.admin.draftBodyPlaceholder')}
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void submit()}
          className="rounded-full bg-[#1d1d1f] px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
        >
          {t('osm.admin.saveDraft')}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-[#d2d2d7] px-3 py-1 text-xs font-semibold"
        >
          {t('common.close')}
        </button>
      </div>
    </div>
  )
}

function DocumentVersionsPanel({
  doc,
  onRefresh,
}: {
  doc: LegalDocumentRow
  onRefresh: () => Promise<void>
}) {
  const { t } = useApp()
  const [busy, setBusy] = useState<string | null>(null)
  const versions = (doc.document_versions ?? []).slice().sort((a, b) => {
    const ap = a.published_at ? new Date(a.published_at).getTime() : 0
    const bp = b.published_at ? new Date(b.published_at).getTime() : 0
    return bp - ap
  })

  const act = async (kind: 'publish' | 'rollback', versionId: string) => {
    setBusy(versionId)
    try {
      if (kind === 'publish') await publishDocumentVersion(versionId)
      else await rollbackDocumentVersion(versionId)
      await onRefresh()
    } finally {
      setBusy(null)
    }
  }

  if (!versions.length) {
    return (
      <>
        <p className="mt-2 text-xs text-[#86868b]">{t('osm.admin.noVersions')}</p>
        <CreateDraftVersionForm doc={doc} onRefresh={onRefresh} />
      </>
    )
  }

  return (
    <>
    <ul className="mt-3 space-y-2 border-t border-[#f0f0f2] pt-3">
      {versions.map((v: DocumentVersionRow) => {
        const isCurrent = doc.current_version_id === v.id
        const canRollback = canRollbackToVersion(v) && !isCurrent
        const canPublish = v.status === 'draft' || v.status === 'review_required' || v.status === 'approved'
        return (
          <li
            key={v.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#fafafa] px-3 py-2 text-xs"
          >
            <div>
              <span className="font-semibold text-[#1d1d1f]">v{v.version_number}</span>
              <span className="ml-2 text-[#86868b]">{v.status}</span>
              {isAutoDraftVersion(v.version_number) ? (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-900">
                  {t('osm.admin.autoDraftBadge')}
                </span>
              ) : null}
              {isCurrent ? (
                <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">
                  {t('osm.admin.currentVersion')}
                </span>
              ) : null}
              {v.effective_from ? (
                <p className="mt-0.5 text-[#86868b]">
                  {t('osm.admin.effectiveFrom')}: {new Date(v.effective_from).toLocaleDateString()}
                </p>
              ) : null}
            </div>
            <div className="flex gap-1.5">
              {canPublish ? (
                <button
                  type="button"
                  disabled={busy === v.id}
                  onClick={() => void act('publish', v.id)}
                  className="inline-flex items-center gap-1 rounded-full bg-[#1d1d1f] px-2.5 py-1 font-semibold text-white disabled:opacity-50"
                >
                  {busy === v.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                  {t('osm.admin.publish')}
                </button>
              ) : null}
              {canRollback ? (
                <button
                  type="button"
                  disabled={busy === v.id}
                  onClick={() => void act('rollback', v.id)}
                  className="inline-flex items-center gap-1 rounded-full border border-[#d2d2d7] px-2.5 py-1 font-semibold hover:bg-white disabled:opacity-50"
                >
                  {busy === v.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                  {t('osm.admin.rollback')}
                </button>
              ) : null}
            </div>
          </li>
        )
      })}
    </ul>
    <CreateDraftVersionForm doc={doc} onRefresh={onRefresh} />
    </>
  )
}

export function OfficialSourcesHealthDashboard() {
  const { t, language } = useApp()
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sources, setSources] = useState<OfficialSourceRow[]>([])
  const [changes, setChanges] = useState<SourceChangeRow[]>([])
  const [docs, setDocs] = useState<LegalDocumentRow[]>([])
  const [selectedChange, setSelectedChange] = useState<SourceChangeRow | null>(null)
  const [telegramOk, setTelegramOk] = useState<boolean | null>(null)
  const [emailOk, setEmailOk] = useState<boolean | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [s, c, d, status] = await Promise.all([
        listOfficialSources(),
        listSourceChanges(30),
        listLegalDocuments(true),
        invokeOfficialSourcesMonitor('status').catch(() => null),
      ])
      setSources(s)
      setChanges(c)
      setDocs(d)
      if (status && typeof status === 'object' && 'telegram_configured' in status) {
        const s = status as { telegram_configured?: boolean; email_configured?: boolean }
        setTelegramOk(Boolean(s.telegram_configured))
        setEmailOk(Boolean(s.email_configured))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const reviewCount = useMemo(
    () => changes.filter((c) => c.status === 'review_required' || c.status === 'detected').length,
    [changes],
  )

  const runCheck = async () => {
    setRunning(true)
    setError(null)
    try {
      await invokeOfficialSourcesMonitor('check_now')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setRunning(false)
    }
  }

  const review = async (changeId: string, decision: 'approved' | 'rejected') => {
    setError(null)
    try {
      await updateSourceChangeStatus(changeId, decision)
      await load()
      setSelectedChange(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const fmt = (iso: string | null) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleString(language.code === 'uk' ? 'uk-UA' : 'en-GB')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#6e6e73]">
        <Loader2 className="h-5 w-5 animate-spin" />
        {t('common.loading')}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#86868b]">
            {t('osm.admin.eyebrow')}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[#1d1d1f]">{t('osm.admin.title')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-[#6e6e73]">{t('osm.admin.subtitle')}</p>
          {telegramOk === false ? (
            <p className="mt-2 text-xs text-amber-800">{t('osm.admin.telegramMissing')}</p>
          ) : null}
          {telegramOk === true ? (
            <p className="mt-2 text-xs text-emerald-700">{t('osm.admin.telegramOk')}</p>
          ) : null}
          {emailOk === false ? (
            <p className="mt-2 text-xs text-amber-800">{t('osm.admin.emailMissing')}</p>
          ) : null}
          {emailOk === true ? (
            <p className="mt-2 text-xs text-emerald-700">{t('osm.admin.emailOk')}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => void runCheck()}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-full bg-[#1d1d1f] px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {t('osm.admin.checkNow')}
        </button>
      </header>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {error}
        </div>
      ) : null}

      {reviewCount > 0 ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">{t('osm.admin.alertTitle')}</p>
            <p className="mt-0.5 text-xs opacity-90">
              {t('osm.admin.alertBody').replace('{count}', String(reviewCount))}
            </p>
          </div>
        </div>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#86868b]">
          {t('osm.admin.sources')}
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-[#e8e8ed] bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[#e8e8ed] bg-[#fafafa] text-xs uppercase text-[#86868b]">
              <tr>
                <th className="px-3 py-2 font-semibold">{t('osm.admin.colSource')}</th>
                <th className="px-3 py-2 font-semibold">{t('osm.admin.colCountry')}</th>
                <th className="px-3 py-2 font-semibold">{t('osm.admin.colChecked')}</th>
                <th className="px-3 py-2 font-semibold">HTTP</th>
                <th className="px-3 py-2 font-semibold">{t('osm.admin.colStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.id} className="border-b border-[#f0f0f2] last:border-0">
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-[#1d1d1f]">{s.source_name}</div>
                    <a
                      href={s.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 inline-flex items-center gap-1 text-xs text-[#007185] hover:underline"
                    >
                      {s.official_domain ?? s.source_url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                  <td className="px-3 py-2.5 text-[#6e6e73]">
                    {s.country_code}
                    {s.region ? ` · ${s.region}` : ''}
                  </td>
                  <td className="px-3 py-2.5 text-[#6e6e73]">{fmt(s.last_checked_at)}</td>
                  <td className="px-3 py-2.5 text-[#6e6e73]">{s.http_status ?? '—'}</td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                      <span className={`h-2 w-2 rounded-full ${statusDot(s.verification_status)}`} />
                      {s.verification_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#86868b]">
          <History className="h-4 w-4" />
          {t('osm.admin.changes')}
        </h2>
        <ul className="space-y-2">
          {changes.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-[#d2d2d7] px-4 py-6 text-center text-sm text-[#86868b]">
              {t('osm.admin.noChanges')}
            </li>
          ) : (
            changes.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e8e8ed] bg-white px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-[#1d1d1f]">
                    {c.official_sources?.source_name ?? c.source_id}
                  </p>
                  <p className="text-xs text-[#6e6e73]">
                    {fmt(c.detected_at)} · {c.change_type} · {c.severity} · {c.status}
                    {c.alert_sent_at ? ` · ${t('osm.admin.alertSent')}` : ''}
                    {c.email_alert_sent_at ? ` · ${t('osm.admin.emailAlertSent')}` : ''}
                  </p>
                  <p className="mt-1 text-xs text-[#6e6e73]">{c.change_summary}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedChange(c)}
                    className="rounded-full border border-[#d2d2d7] px-3 py-1.5 text-xs font-semibold hover:bg-[#f5f5f7]"
                  >
                    {t('osm.admin.diff')}
                  </button>
                  {(c.status === 'review_required' || c.status === 'detected') && (
                    <>
                      <button
                        type="button"
                        onClick={() => void review(c.id, 'approved')}
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {t('osm.admin.approve')}
                      </button>
                      <button
                        type="button"
                        onClick={() => void review(c.id, 'rejected')}
                        className="inline-flex items-center gap-1 rounded-full border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-800"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        {t('osm.admin.reject')}
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      {selectedChange ? (
        <section className="rounded-2xl border border-[#e8e8ed] bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-bold text-[#1d1d1f]">{t('osm.admin.diffTitle')}</h3>
            <button
              type="button"
              onClick={() => setSelectedChange(null)}
              className="text-xs font-semibold text-[#86868b] hover:text-[#1d1d1f]"
            >
              {t('common.close')}
            </button>
          </div>
          <LineDiffView
            oldText={selectedChange.old_excerpt ?? ''}
            newText={selectedChange.new_excerpt ?? ''}
            hint={t('osm.admin.diffHint')}
          />
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#86868b]">
          {t('osm.admin.documents')}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {docs.map((doc) => (
            <article key={doc.id} className="rounded-2xl border border-[#e8e8ed] bg-white p-4">
              <div className="mb-2 flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#1d1d1f]" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-[#1d1d1f]">{doc.title}</h3>
                  <p className="text-xs text-[#6e6e73]">
                    {doc.country_code}
                    {doc.region ? ` · ${doc.region}` : ''} · {doc.doc_kind}
                    {!doc.is_published ? ` · ${t('osm.admin.unpublished')}` : ''}
                  </p>
                </div>
              </div>
              <DocumentFreshnessBadge
                verificationStatus={doc.verification_status}
                lastVerifiedAt={doc.last_verified_at ?? doc.official_sources?.last_checked_at}
                nextVerificationAt={doc.next_verification_at}
                sourceName={doc.official_sources?.source_name}
                sourceUrl={doc.official_sources?.source_url}
                trustTier={doc.official_sources?.trust_tier}
              />
              <DocumentVersionsPanel doc={doc} onRefresh={load} />
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
