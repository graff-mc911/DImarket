import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
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
  Building2,
  ChevronRight,
  Database,
  Factory,
  FlaskConical,
  Globe,
  Handshake,
  Users,
  Wrench,
} from 'lucide-react'
import {
  OWNER_GEO_ALL_REGIONS,
  OWNER_PROFILE_FETCH_LIMIT,
  fetchOwnerConsistencyCounts,
  fetchPublicListableProfileCount,
  fetchPublicTopCompaniesCount,
  fetchPublicTopMastersCount,
  groupOwnerProfilesByGeo,
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

const FILTERS: { id: OwnerProfileFilter; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: 'top_masters', label: 'Топ майстри', icon: Wrench },
  { id: 'top_companies', label: 'Топ компанії', icon: Building2 },
  { id: 'qa', label: 'QA / тест', icon: FlaskConical },
  { id: 'public_listable', label: 'Усі публічні', icon: Globe },
  { id: 'all', label: 'Усі в БД', icon: Database },
  { id: 'professional', label: 'Майстри+компанії', icon: Users },
  { id: 'company', label: 'Компанії', icon: Building2 },
  { id: 'manufacturer', label: 'Виробники', icon: Factory },
  { id: 'commercial_agent', label: 'Агенти', icon: Handshake },
  { id: 'hidden', label: 'Приховані', icon: EyeOff },
  { id: 'deleted', label: 'Видалені', icon: Trash2 },
]

function filterLabel(id: OwnerProfileFilter): string {
  return FILTERS.find((f) => f.id === id)?.label ?? id
}

export function OwnerProfilesManager() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<OwnerProfileFilter>('top_masters')
  const [expanded, setExpanded] = useState(true)
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
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
  const autoGeoKey = useRef('')

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

      if (expected != null && data.length === 0 && expected > 0) {
        setError(`Список порожній, хоча на сайті видно ${expected}. Оновіть сторінку (Ctrl+Shift+R).`)
      } else if (expected != null && data.length > 0 && data.length < expected) {
        setNotice(`Показано ${data.length} з ~${expected}.`)
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

  const geoTree = useMemo(() => groupOwnerProfilesByGeo(rows), [rows])

  useEffect(() => {
    if (!expanded || loading || geoTree.length !== 1) return
    const key = `${filter}|${query}|${rows.length}|${geoTree[0].country}`
    if (autoGeoKey.current === key) return
    autoGeoKey.current = key
    setSelectedCountry(geoTree[0].country)
    if (geoTree[0].regions.length === 1) {
      setSelectedRegion(geoTree[0].regions[0].region)
    }
  }, [expanded, loading, geoTree, filter, query, rows.length])

  const countryGroup = geoTree.find((g) => g.country === selectedCountry) ?? null
  const visibleRows = useMemo(() => {
    if (!countryGroup || !selectedRegion) return []
    if (selectedRegion === OWNER_GEO_ALL_REGIONS) {
      return countryGroup.regions.flatMap((r) => r.rows)
    }
    return countryGroup.regions.find((r) => r.region === selectedRegion)?.rows ?? []
  }, [countryGroup, selectedRegion])

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

  const openFilter = (id: OwnerProfileFilter) => {
    if (filter === id) {
      setExpanded((open) => !open)
      return
    }
    setFilter(id)
    setExpanded(true)
    setSelectedCountry(null)
    setSelectedRegion(null)
    autoGeoKey.current = ''
    void load(query, id)
  }

  const pickCountry = (country: string) => {
    if (selectedCountry === country) {
      setSelectedCountry(null)
      setSelectedRegion(null)
      return
    }
    setSelectedCountry(country)
    setSelectedRegion(null)
  }

  const pickRegion = (region: string) => {
    setSelectedRegion((prev) => (prev === region ? null : region))
  }

  const countFor = (id: OwnerProfileFilter): number | null => {
    if (id === 'top_masters') return topMastersCount
    if (id === 'top_companies') return topCompaniesCount
    if (id === 'public_listable' || id === 'professional') return publicCount
    if (id === 'qa') return counts?.qa_named ?? null
    if (id === 'hidden') return counts?.hidden ?? null
    if (id === 'deleted') return counts?.deleted ?? null
    if (id === 'all') return counts?.all_profiles ?? null
    if (id === filter) return rows.length
    return null
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

  const geoHint =
    !selectedCountry
      ? 'Оберіть країну'
      : !selectedRegion
        ? 'Оберіть регіон'
        : selectedRegion === OWNER_GEO_ALL_REGIONS
          ? `${selectedCountry} · усі регіони`
          : `${selectedCountry} · ${selectedRegion}`

  return (
    <div className="rounded-none border border-[var(--glass-border)] bg-white/50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-[#2f2a24]">Профілі</h2>
          <p className="mt-1 text-sm text-[#6f665d]">
            Натисніть групу — як категорію. Далі країна і регіон, потім список.
          </p>
        </div>
      </div>

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
            Майстри: {topMastersCount ?? counts?.masters_role ?? '—'} · Компанії:{' '}
            {topCompaniesCount ?? counts?.companies_role ?? '—'} · У групі: {rows.length}
            {counts ? ` · QA: ${counts.qa_named} · Hidden: ${counts.hidden} · Deleted: ${counts.deleted}` : ''}
            {geoTree.length > 0 ? ` · Країн: ${geoTree.length}` : ''}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a9188]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setSelectedCountry(null)
                setSelectedRegion(null)
                autoGeoKey.current = ''
                void load(query, filter)
              }
            }}
            placeholder="Імʼя, email, телефон, profile_id, роль…"
            className="w-full rounded-xl border border-[rgba(148,163,184,0.35)] bg-white py-2.5 pl-10 pr-3 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectedCountry(null)
            setSelectedRegion(null)
            autoGeoKey.current = ''
            void load(query, filter)
          }}
          className="rounded-xl bg-[#2f2a24] px-4 py-2.5 text-sm font-bold text-white"
        >
          Шукати
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {FILTERS.map((f) => {
          const Icon = f.icon
          const isOpen = expanded && filter === f.id
          const n = countFor(f.id)
          return (
            <article
              key={f.id}
              className={`dimarket-category-card ${isOpen ? 'sm:col-span-2 xl:col-span-3' : ''}`}
            >
              <button
                type="button"
                className="dimarket-category-card__button"
                onClick={() => openFilter(f.id)}
                aria-expanded={isOpen}
                aria-label={`${isOpen ? 'Згорнути' : 'Відкрити'}: ${f.label}`}
              >
                <span className="dimarket-category-card__icon" aria-hidden>
                  <Icon className="h-8 w-8 text-[#1b4d3e]" />
                </span>
                <span className="dimarket-category-card__body">
                  <strong>{f.label}</strong>
                  <span>
                    {n == null ? 'Натисніть, щоб відкрити' : `${n} проф.`}
                    {isOpen && geoTree.length > 0 ? ` · ${geoTree.length} країн` : ''}
                  </span>
                </span>
                <ChevronRight className="dimarket-category-card__chevron h-5 w-5" aria-hidden />
              </button>

              {isOpen ? (
                <div className="dimarket-subcategories">
                  <div>
                    {loading && (
                      <p className="px-1 py-1 text-sm text-[#6f665d]">Завантаження…</p>
                    )}
                    {!loading && geoTree.length === 0 && (
                      <p className="px-1 py-1 text-sm text-[#6f665d]">
                        Нічого не знайдено в цій групі.
                      </p>
                    )}
                    {!loading &&
                      geoTree.map((country) => (
                        <button
                          key={country.country}
                          type="button"
                          className={`dimarket-subcategory-chip ${
                            selectedCountry === country.country
                              ? 'dimarket-subcategory-chip--primary'
                              : ''
                          }`}
                          aria-pressed={selectedCountry === country.country}
                          onClick={() => pickCountry(country.country)}
                        >
                          {country.country}
                          <span className="font-bold text-inherit opacity-70">({country.count})</span>
                        </button>
                      ))}
                  </div>
                  {countryGroup ? (
                    <div>
                      <span className="w-full basis-full pt-1 text-[11px] font-bold uppercase tracking-wide text-[#6f665d]">
                        Регіони · {countryGroup.country}
                      </span>
                        {countryGroup.regions.length > 1 ? (
                          <button
                            type="button"
                            className={`dimarket-subcategory-chip ${
                              selectedRegion === OWNER_GEO_ALL_REGIONS
                                ? 'dimarket-subcategory-chip--primary'
                                : ''
                            }`}
                            aria-pressed={selectedRegion === OWNER_GEO_ALL_REGIONS}
                            onClick={() => pickRegion(OWNER_GEO_ALL_REGIONS)}
                          >
                            Усі регіони
                            <span className="font-bold text-inherit opacity-70">({countryGroup.count})</span>
                          </button>
                        ) : null}
                        {countryGroup.regions.map((region) => (
                          <button
                            key={region.region}
                            type="button"
                            className={`dimarket-subcategory-chip ${
                              selectedRegion === region.region
                                ? 'dimarket-subcategory-chip--primary'
                                : ''
                            }`}
                            aria-pressed={selectedRegion === region.region}
                            onClick={() => pickRegion(region.region)}
                          >
                            {region.region}
                            <span className="font-bold text-inherit opacity-70">({region.count})</span>
                          </button>
                        ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </article>
          )
        })}
      </div>

      {migrationHint && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Немає доступу до модерації профілів. Оновіть сторінку або перевірте, що ви залогінені як owner.
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

      <div className="mt-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[#2f2a24]">
            {filterLabel(filter)} · {geoHint}
            {selectedRegion ? ` · ${visibleRows.length}` : ''}
          </p>
          {selectedCountry ? (
            <button
              type="button"
              className="text-xs font-bold text-[#c96d2c]"
              onClick={() => {
                if (selectedRegion) setSelectedRegion(null)
                else setSelectedCountry(null)
              }}
            >
              {selectedRegion ? 'Назад до регіонів' : 'Назад до країн'}
            </button>
          ) : null}
        </div>

        <div className="space-y-3">
          {expanded && !loading && !selectedCountry && rows.length > 0 && (
            <p className="text-sm text-[#6f665d]">
              Спочатку країна, потім регіон — інакше в довгому списку нічого не знайти.
            </p>
          )}
          {expanded && selectedCountry && !selectedRegion && (
            <p className="text-sm text-[#6f665d]">Оберіть регіон або «Усі регіони».</p>
          )}
          {visibleRows.map((row) => (
            <ProfileModerationCard
              key={row.id}
              row={row}
              busy={busyId === row.id}
              onAction={runAction}
              onError={setError}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ProfileModerationCard({
  row,
  busy,
  onAction,
  onError,
}: {
  row: OwnerProfileRow
  busy: boolean
  onAction: (
    id: string,
    action: () => Promise<{ ok?: boolean; error?: string }>,
    okMsg: string,
  ) => Promise<void>
  onError: (msg: string) => void
}) {
  const hidden = Boolean(row.hidden_at || row.is_hidden)
  const deleted = Boolean(row.deleted_at || row.is_deleted)

  return (
    <div className="rounded-xl border border-[rgba(148,163,184,0.28)] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-[#2f2a24]">{row.full_name || '(без імені)'}</p>
          <p className="mt-0.5 break-all text-xs text-[#6f665d]">
            {row.email || '—'} · {row.phone || '—'} · {row.user_role || '—'}
          </p>
          {row.location ? (
            <p className="mt-0.5 text-xs text-[#6f665d]">{row.location}</p>
          ) : null}
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
                void onAction(row.id, () => ownerHideProfile(row.id), 'Приховано з публічної видачі')
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
                void onAction(row.id, () => ownerUnhideProfile(row.id), 'Повернено в публічну видачу')
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
                void onAction(row.id, () => ownerSoftDeleteProfile(row.id), 'Профіль soft-deleted')
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
                void onAction(row.id, () => ownerRestoreProfile(row.id), 'Профіль відновлено')
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
              void onAction(
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
                onError('Некоректний priority')
                return
              }
              void onAction(
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
}
