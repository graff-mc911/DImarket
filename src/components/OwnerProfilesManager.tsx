import { useCallback, useEffect, useState } from 'react'
import {
  Eye,
  EyeOff,
  RotateCcw,
  Search,
  Star,
  Trash2,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import {
  OWNER_PROFILE_FETCH_LIMIT,
  fetchOwnerConsistencyCounts,
  fetchPublicListableProfileCount,
  fetchPublicTopCompaniesCount,
  fetchPublicTopMastersCount,
  ownerHideProfile,
  ownerRestoreProfile,
  ownerSearchProfiles,
  ownerSetRankingPriority,
  ownerSoftDeleteProfile,
  ownerUnhideProfile,
  ownerUpdateProfileFlags,
  type OwnerConsistencyCounts,
  type OwnerProfileFilter,
  type OwnerProfileRow,
} from '../lib/ownerProfiles'
import { navigateTo } from '../lib/navigation'

const FILTERS: { id: OwnerProfileFilter; label: string }[] = [
  { id: 'top_masters', label: 'Топ майстри' },
  { id: 'top_companies', label: 'Топ компанії' },
  { id: 'qa', label: 'QA / тест' },
  { id: 'public_listable', label: 'Усі публічні' },
  { id: 'all', label: 'Усі в БД' },
  { id: 'professional', label: 'Майстри+компанії' },
  { id: 'company', label: 'Компанії' },
  { id: 'manufacturer', label: 'Виробники' },
  { id: 'commercial_agent', label: 'Агенти' },
  { id: 'hidden', label: 'Приховані' },
  { id: 'deleted', label: 'Видалені' },
]

export function OwnerProfilesManager() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<OwnerProfileFilter>('top_masters')
  const [rows, setRows] = useState<OwnerProfileRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [migrationHint, setMigrationHint] = useState(false)
  const [publicCount, setPublicCount] = useState<number | null>(null)
  const [topMastersCount, setTopMastersCount] = useState<number | null>(null)
  const [topCompaniesCount, setTopCompaniesCount] = useState<number | null>(null)
  const [counts, setCounts] = useState<OwnerConsistencyCounts | null>(null)

  const load = useCallback(async (q = query, f = filter) => {
    setLoading(true)
    setError('')
    try {
      const [data, pub, top, topCo, consistency] = await Promise.all([
        ownerSearchProfiles({ query: q, filter: f, limit: OWNER_PROFILE_FETCH_LIMIT }),
        fetchPublicListableProfileCount().catch(() => null),
        fetchPublicTopMastersCount().catch(() => null),
        fetchPublicTopCompaniesCount().catch(() => null),
        fetchOwnerConsistencyCounts(),
      ])
      setRows(data)
      setPublicCount(pub)
      setTopMastersCount(top)
      setTopCompaniesCount(topCo)
      setCounts(consistency)
      setMigrationHint(false)

      const expected =
        f === 'top_masters' && !q.trim()
          ? top
          : f === 'top_companies' && !q.trim()
            ? topCo
          : (f === 'public_listable' || f === 'professional') && !q.trim()
            ? pub
            : null

      if (expected != null && data.length < expected) {
        setError(
          `РОЗРИВ ДАНИХ: публіка бачить ${expected}, Owner панель показує ${data.length}. Застосуйте APPLY_OWNER_PROFILE_MODERATION.sql і оновіть сторінку.`,
        )
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setRows([])
      setError(msg)
      if (/admin_search_profiles|function|schema cache|does not exist|forbidden/i.test(msg)) {
        setMigrationHint(true)
      }
    } finally {
      setLoading(false)
    }
  }, [filter, query])

  useEffect(() => {
    void load('', 'top_masters')
  }, [])

  const runAction = async (
    id: string,
    action: () => Promise<{ ok?: boolean; error?: string }>,
    okMsg: string,
  ) => {
    setBusyId(id)
    setNotice('')
    setError('')
    try {
      const res = await action()
      if (res && res.ok === false) throw new Error(res.error || 'action_failed')
      setNotice(okMsg)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusyId(null)
    }
  }

  const syncTarget =
    filter === 'top_masters' && !query.trim()
      ? topMastersCount
      : filter === 'top_companies' && !query.trim()
        ? topCompaniesCount
      : (filter === 'public_listable' || filter === 'professional') && !query.trim()
        ? publicCount
        : null
  const consistent = syncTarget != null && rows.length >= syncTarget

  return (
    <div className="rounded-[22px] border border-[var(--glass-border)] bg-white/50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-[#2f2a24]">Профілі DImarket</h2>
          <p className="mt-1 text-sm text-[#6f665d]">
            Одна БД → публічні «Топ майстри» / «Топ компанії» ↔ Owner (пошук QA → Hide / Delete).
          </p>
        </div>
      </div>

      <pre className="mt-3 overflow-x-auto rounded-xl border border-[rgba(148,163,184,0.35)] bg-[#f8f7f5] p-3 text-[11px] leading-5 text-[#4a453f]">
{`SUPABASE profiles
   ↓
PUBLIC: is_professional + user_role=professional | company
   ↓
«ТОП МАЙСТРИ» / «ТОП КОМПАНІЇ»  ←→  OWNER: відповідний фільтр / «QA»
   ↓                                      ↓
КЛІЄНТ                                   DELETE / HIDE / FEATURED`}
      </pre>

      <div
        className={`mt-4 rounded-xl border px-3 py-3 text-sm ${
          consistent
            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
            : syncTarget != null && rows.length < syncTarget
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-[rgba(148,163,184,0.35)] bg-white text-[#6f665d]'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 font-semibold">
          {consistent ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          <span>
            Топ майстри: {topMastersCount ?? '—'} · Топ компанії: {topCompaniesCount ?? '—'} ·
            Усі публічні: {publicCount ?? '—'} · Owner список: {rows.length}
            {counts ? ` · Усі в БД: ${counts.all_profiles}` : ''}
          </span>
        </div>
        <p className="mt-1 text-xs leading-5">
          Синхрон: хто на головній у «Топ компанії» — той у фільтрі «Топ компанії» тут. QA → Hide/Delete
          прибирає з публічної видачі.
        </p>
        {counts && (
          <p className="mt-1 text-xs">
            Майстри: {counts.masters_role} · Компанії: {counts.companies_role} · QA: {counts.qa_named}{' '}
            · Hidden: {counts.hidden} · Deleted: {counts.deleted}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a9188]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void load(query, filter)
            }}
            placeholder="Імʼя, email, телефон, profile_id, роль…"
            className="w-full rounded-xl border border-[rgba(148,163,184,0.35)] bg-white py-2.5 pl-10 pr-3 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => void load(query, filter)}
          className="rounded-xl bg-[#2f2a24] px-4 py-2.5 text-sm font-bold text-white"
        >
          Шукати
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              setFilter(f.id)
              void load(query, f.id)
            }}
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              filter === f.id
                ? 'bg-[#2f2a24] text-white'
                : 'border border-[rgba(148,163,184,0.35)] bg-white text-[#6f665d]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {migrationHint && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Потрібно застосувати SQL:{' '}
          <code className="font-mono">supabase/migrations/APPLY_OWNER_PROFILE_MODERATION.sql</code> у
          Supabase SQL Editor (owner RPC + soft-delete/hide + ліміт до 2000).
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {notice}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {loading && <p className="text-sm text-[#6f665d]">Завантаження…</p>}
        {!loading && rows.length === 0 && (
          <p className="text-sm text-[#6f665d]">
            Нічого не знайдено. Спробуйте фільтр «QA / тест» або інший запит.
          </p>
        )}
        {rows.map((row) => {
          const hidden = Boolean(row.hidden_at || row.is_hidden)
          const deleted = Boolean(row.deleted_at || row.is_deleted)
          const busy = busyId === row.id
          return (
            <div
              key={row.id}
              className="rounded-xl border border-[rgba(148,163,184,0.28)] bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-[#2f2a24]">{row.full_name || '(без імені)'}</p>
                  <p className="mt-0.5 break-all text-xs text-[#6f665d]">
                    {row.email || '—'} · {row.phone || '—'} · {row.user_role || '—'}
                  </p>
                  <p className="mt-0.5 break-all font-mono text-[11px] text-[#9a9188]">{row.id}</p>
                  <p className="mt-1 text-xs text-[#6f665d]">
                    rating {row.rating ?? 0} · reviews {row.total_reviews ?? 0} · priority{' '}
                    {row.ranking_priority ?? 0}
                    {row.is_featured ? ' · featured' : ''}
                    {row.is_verified ? ' · verified' : ''}
                    {hidden ? ' · HIDDEN' : ''}
                    {deleted ? ' · DELETED' : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold"
                    onClick={() => navigateTo(`/professional/${row.id}`)}
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> View
                  </button>
                  {!deleted && !hidden && (
                    <button
                      type="button"
                      disabled={busy}
                      className="inline-flex items-center gap-1 rounded-full border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800"
                      onClick={() =>
                        void runAction(row.id, () => ownerHideProfile(row.id), 'Приховано з публічної видачі')
                      }
                    >
                      <EyeOff className="h-3.5 w-3.5" /> Hide
                    </button>
                  )}
                  {!deleted && hidden && (
                    <button
                      type="button"
                      disabled={busy}
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800"
                      onClick={() =>
                        void runAction(row.id, () => ownerUnhideProfile(row.id), 'Повернено в публічну видачу')
                      }
                    >
                      <Eye className="h-3.5 w-3.5" /> Unhide
                    </button>
                  )}
                  {!deleted && (
                    <button
                      type="button"
                      disabled={busy}
                      className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-xs font-bold text-red-700"
                      onClick={() => {
                        if (!window.confirm(`Soft-delete «${row.full_name || row.id}»?`)) return
                        void runAction(row.id, () => ownerSoftDeleteProfile(row.id), 'Профіль soft-deleted')
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  )}
                  {(deleted || hidden) && (
                    <button
                      type="button"
                      disabled={busy}
                      className="inline-flex items-center gap-1 rounded-full border border-sky-200 px-3 py-1 text-xs font-bold text-sky-800"
                      onClick={() =>
                        void runAction(row.id, () => ownerRestoreProfile(row.id), 'Профіль відновлено')
                      }
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Restore
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold"
                    onClick={() =>
                      void runAction(
                        row.id,
                        () => ownerUpdateProfileFlags(row.id, { is_featured: !row.is_featured }),
                        row.is_featured ? 'Featured знято' : 'Featured увімкнено',
                      )
                    }
                  >
                    <Star className="h-3.5 w-3.5" /> Featured
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    className="rounded-full border px-3 py-1 text-xs font-bold"
                    onClick={() => {
                      const raw = window.prompt(
                        'Ranking priority (число, не рейтинг користувача)',
                        String(row.ranking_priority ?? 0),
                      )
                      if (raw == null) return
                      const n = Number(raw)
                      if (!Number.isFinite(n)) {
                        setError('Некоректний priority')
                        return
                      }
                      void runAction(
                        row.id,
                        () => ownerSetRankingPriority(row.id, Math.trunc(n)),
                        `Priority = ${Math.trunc(n)}`,
                      )
                    }}
                  >
                    Priority
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
