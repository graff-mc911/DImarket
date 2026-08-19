import { useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import {
  OWNER_GEO_ALL_REGIONS,
  groupRowsByLocation,
} from '../lib/ownerProfiles'

export type OwnerCabinetQueueFilter<Id extends string = string> = {
  id: Id
  label: string
  icon: ComponentType<{ className?: string }>
}

type OwnerCabinetGeoQueueProps<T, Id extends string> = {
  title: string
  subtitle: string
  filters: OwnerCabinetQueueFilter<Id>[]
  activeId: Id
  rows: T[]
  locationOf: (row: T) => string | null | undefined
  loading: boolean
  countFor: (id: Id) => number | null
  emptyText: string
  onSelect: (id: Id) => void
  renderRow: (row: T) => ReactNode
  notice?: string
  error?: string
  extra?: ReactNode
}

export function OwnerCabinetGeoQueue<T, Id extends string>({
  title,
  subtitle,
  filters,
  activeId,
  rows,
  locationOf,
  loading,
  countFor,
  emptyText,
  onSelect,
  renderRow,
  notice,
  error,
  extra,
}: OwnerCabinetGeoQueueProps<T, Id>) {
  const [expanded, setExpanded] = useState(true)
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const autoGeoKey = useRef('')

  const geoTree = useMemo(() => groupRowsByLocation(rows, locationOf), [rows, locationOf])

  useEffect(() => {
    setSelectedCountry(null)
    setSelectedRegion(null)
    autoGeoKey.current = ''
  }, [activeId])

  useEffect(() => {
    if (!expanded || loading || geoTree.length !== 1) return
    const key = `${activeId}|${rows.length}|${geoTree[0].country}`
    if (autoGeoKey.current === key) return
    autoGeoKey.current = key
    setSelectedCountry(geoTree[0].country)
    if (geoTree[0].regions.length === 1) {
      setSelectedRegion(geoTree[0].regions[0].region)
    }
  }, [expanded, loading, geoTree, activeId, rows.length])

  const countryGroup = geoTree.find((g) => g.country === selectedCountry) ?? null
  const visibleRows = useMemo(() => {
    if (!countryGroup || !selectedRegion) return []
    if (selectedRegion === OWNER_GEO_ALL_REGIONS) {
      return countryGroup.regions.flatMap((r) => r.rows)
    }
    return countryGroup.regions.find((r) => r.region === selectedRegion)?.rows ?? []
  }, [countryGroup, selectedRegion])

  const openFilter = (id: Id) => {
    if (activeId === id) {
      setExpanded((open) => !open)
      return
    }
    onSelect(id)
    setExpanded(true)
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

  const activeLabel = filters.find((f) => f.id === activeId)?.label ?? String(activeId)
  const geoHint =
    !selectedCountry
      ? 'Оберіть країну'
      : !selectedRegion
        ? 'Оберіть регіон'
        : selectedRegion === OWNER_GEO_ALL_REGIONS
          ? `${selectedCountry} · усі регіони`
          : `${selectedCountry} · ${selectedRegion}`

  return (
    <div className="rounded-[22px] border border-[var(--glass-border)] bg-white/50 p-5">
      <div>
        <h2 className="text-lg font-extrabold text-[#2f2a24]">{title}</h2>
        <p className="mt-1 text-sm text-[#6f665d]">{subtitle}</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filters.map((f) => {
          const Icon = f.icon
          const isOpen = expanded && activeId === f.id
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
                    {n == null ? 'Натисніть, щоб відкрити' : `${n} заяв.`}
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
                      <p className="px-1 py-1 text-sm text-[#6f665d]">{emptyText}</p>
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

      {error ? (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {notice}
        </div>
      ) : null}

      <div className="mt-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[#2f2a24]">
            {activeLabel} · {geoHint}
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
          {visibleRows.map((row) => renderRow(row))}
        </div>
      </div>

      {extra}
    </div>
  )
}
