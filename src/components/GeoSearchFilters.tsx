import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ChevronDown, LocateFixed } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import type { TranslationKey } from '../lib/i18n'
import {
  EMPTY_GEO_SELECTION,
  hasProvinceLevel,
  listCities,
  listCountries,
  listProvinces,
  listRegions,
  loadGeoCatalog,
} from '../lib/geoHierarchy'
import type { AdGeoCountry } from '../lib/adGeoCatalog'
import {
  EMPTY_GEO_SEARCH,
  GEO_RADIUS_OPTIONS,
  knownCityCenter,
  resolveCityCenter,
  type GeoRadiusMode,
  type GeoSearchState,
} from '../lib/geoSearch'
import { getCurrentLocationDetailed } from '../lib/geocoding'
import { canonicalCountryName, canonicalRegionName } from '../lib/geoAliases'

interface GeoSearchFiltersProps {
  value: GeoSearchState
  onChange: (next: GeoSearchState) => void
  className?: string
  /**
   * `panel` is the header location dropdown: the country list scrolls in-place
   * so region / city / radius / GPS stay reachable. `default` keeps native
   * selects for sidebar filters.
   */
  variant?: 'default' | 'panel'
}

type FilterOption = { value: string; label: string }

function PanelFilterField({
  fieldId,
  label,
  value,
  placeholder,
  options,
  disabled,
  onChange,
  alwaysExpanded = false,
  open = false,
  onOpenChange,
  includeEmpty = true,
}: {
  fieldId: string
  label: string
  value: string
  placeholder: string
  options: FilterOption[]
  disabled?: boolean
  onChange: (value: string) => void
  alwaysExpanded?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  includeEmpty?: boolean
}) {
  const listRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)
  const showList = alwaysExpanded || open

  useEffect(() => {
    if (!showList) return
    selectedRef.current?.scrollIntoView({ block: 'nearest' })
  }, [showList, value])

  const pick = (next: string) => {
    onChange(next)
    if (!alwaysExpanded) onOpenChange?.(false)
  }

  const list = (
    <div
      ref={listRef}
      id={`${fieldId}-list`}
      role="listbox"
      aria-label={label}
      aria-disabled={disabled || undefined}
      className={`geo-filter-listbox ${alwaysExpanded ? 'geo-filter-listbox--country' : ''}`}
    >
      {includeEmpty ? (
        <button
          type="button"
          role="option"
          aria-selected={!value}
          className={`geo-filter-option ${!value ? 'is-selected' : ''}`}
          ref={!value ? selectedRef : undefined}
          disabled={disabled}
          onClick={() => pick('')}
        >
          {placeholder}
        </button>
      ) : null}
      {options.map((opt) => {
        const selected = opt.value === value
        return (
          <button
            key={opt.value || opt.label}
            type="button"
            role="option"
            aria-selected={selected}
            className={`geo-filter-option ${selected ? 'is-selected' : ''}`}
            ref={selected ? selectedRef : undefined}
            disabled={disabled}
            onClick={() => pick(opt.value)}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )

  return (
    <div
      className={`amazon-filter-group geo-filter-field ${
        alwaysExpanded ? 'geo-filter-field--country' : ''
      }`}
    >
      <label htmlFor={alwaysExpanded ? `${fieldId}-list` : `${fieldId}-trigger`}>{label}</label>
      {alwaysExpanded ? (
        list
      ) : (
        <>
          <button
            id={`${fieldId}-trigger`}
            type="button"
            className="select-glass geo-filter-select geo-filter-select--trigger"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={`${fieldId}-list`}
            disabled={disabled}
            onClick={() => onOpenChange?.(!open)}
          >
            <span>{options.find((o) => o.value === value)?.label || placeholder}</span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
          </button>
          {showList ? list : null}
        </>
      )}
    </div>
  )
}

/**
 * Cascading country → region → province → city → radius filters.
 * Uses existing amazon-filter-group / select-glass styles (no visual redesign).
 */
export function GeoSearchFilters({
  value,
  onChange,
  className = '',
  variant = 'default',
}: GeoSearchFiltersProps) {
  const { t } = useApp()
  const [catalog, setCatalog] = useState<AdGeoCountry[] | null>(null)
  const [gpsBusy, setGpsBusy] = useState(false)
  const [gpsError, setGpsError] = useState('')
  const [openField, setOpenField] = useState<string | null>(null)
  const filterId = useId()
  const isPanel = variant === 'panel'

  useEffect(() => {
    let cancelled = false
    void loadGeoCatalog().then((data) => {
      if (!cancelled) setCatalog(data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const countries = useMemo(() => (catalog ? listCountries(catalog) : []), [catalog])
  const regions = useMemo(
    () => (catalog && value.country ? listRegions(catalog, value.country) : []),
    [catalog, value.country],
  )
  const showProvince = Boolean(value.country && value.region && hasProvinceLevel(value.country, value.region))
  const provinces = useMemo(
    () =>
      catalog && value.country && value.region
        ? listProvinces(catalog, value.country, value.region)
        : [],
    [catalog, value.country, value.region],
  )
  const cities = useMemo(
    () =>
      catalog && value.country && value.region
        ? listCities(catalog, value.country, value.region, value.province)
        : [],
    [catalog, value.country, value.region, value.province],
  )

  const patch = async (partial: Partial<GeoSearchState>) => {
    let next: GeoSearchState = { ...value, ...partial, fromGps: partial.fromGps ?? false }

    // Cascade resets
    if ('country' in partial) {
      setOpenField(null)
      next = { ...next, region: '', province: '', city: '', originLat: null, originLng: null }
    } else if ('region' in partial) {
      next = { ...next, province: '', city: '', originLat: null, originLng: null }
    } else if ('province' in partial) {
      next = { ...next, city: '', originLat: null, originLng: null }
    }

    if (next.city && next.country) {
      const known = knownCityCenter(next.country, next.city)
      if (known) {
        next = { ...next, originLat: known.lat, originLng: known.lon }
      } else {
        const center = await resolveCityCenter(next.country, next.city)
        if (center) next = { ...next, originLat: center.lat, originLng: center.lon }
      }
    }

    onChange(next)
  }

  const locateMe = async () => {
    setGpsBusy(true)
    setGpsError('')
    try {
      const detailed = await getCurrentLocationDetailed()
      if (!detailed) {
        setGpsError(t('geo.gpsDenied'))
        return
      }

      const country = canonicalCountryName(detailed.country) || detailed.country
      let region = detailed.region || ''
      if (catalog && country && region) {
        const regionsForCountry = listRegions(catalog, country)
        const match = regionsForCountry.find(
          (r) =>
            r.toLowerCase() === region.toLowerCase() ||
            region.toLowerCase().includes(r.toLowerCase()) ||
            r.toLowerCase().includes(region.toLowerCase()),
        )
        region = match || canonicalRegionName(country, region)
      }

      let province = detailed.province || ''
      if (catalog && country && region && hasProvinceLevel(country, region)) {
        const provs = listProvinces(catalog, country, region)
        const match = provs.find(
          (p) =>
            p.toLowerCase() === province.toLowerCase() ||
            p.toLowerCase() === detailed.city.toLowerCase() ||
            province.toLowerCase().includes(p.toLowerCase()),
        )
        province = match || ''
        if (!province) {
          // Prefer province that contains the city
          const byCity = provs.find((p) =>
            listCities(catalog, country, region, p).some(
              (c) => c.toLowerCase() === detailed.city.toLowerCase(),
            ),
          )
          province = byCity || ''
        }
      }

      let city = detailed.city
      if (catalog && country && region) {
        const cityList = listCities(catalog, country, region, province)
        const match = cityList.find((c) => c.toLowerCase() === city.toLowerCase())
        city = match || city
      }

      onChange({
        ...EMPTY_GEO_SEARCH,
        country,
        region,
        province,
        city,
        radius: value.radius || '25',
        originLat: detailed.lat,
        originLng: detailed.lon,
        fromGps: true,
      })
    } catch {
      setGpsError(t('geo.gpsDenied'))
    } finally {
      setGpsBusy(false)
    }
  }

  const clearGeo = () => onChange({ ...EMPTY_GEO_SEARCH })

  const countryOptions = useMemo(
    () => countries.map((c) => ({ value: c, label: c })),
    [countries],
  )
  const regionOptions = useMemo(
    () => regions.map((r) => ({ value: r, label: r })),
    [regions],
  )
  const provinceOptions = useMemo(
    () => provinces.map((p) => ({ value: p, label: p })),
    [provinces],
  )
  const cityOptions = useMemo(
    () => cities.map((c) => ({ value: c, label: c })),
    [cities],
  )
  const radiusOptions = useMemo(
    () =>
      GEO_RADIUS_OPTIONS.map((opt) => ({
        value: opt.id,
        label: t(`geo.radius.${opt.id}` as TranslationKey),
      })),
    [t],
  )

  const gpsBlock = (
    <div className="amazon-filter-group geo-filter-field geo-filter-field--actions">
      <button
        type="button"
        className="btn-secondary geo-filter-gps flex w-full items-center justify-center gap-2 text-sm"
        onClick={() => void locateMe()}
        disabled={gpsBusy}
      >
        <LocateFixed className="h-4 w-4 shrink-0" aria-hidden />
        {gpsBusy
          ? t('geo.gpsLoading')
          : value.fromGps
            ? t('geo.gpsActive')
            : t('geo.useMyLocation')}
      </button>
      {gpsError ? <p className="mt-1 text-xs leading-snug text-red-600">{gpsError}</p> : null}
      {(value.country || value.city || value.fromGps) && (
        <button type="button" className="amazon-link geo-filter-clear mt-2 text-xs leading-snug" onClick={clearGeo}>
          {t('geo.clear')}
        </button>
      )}
    </div>
  )

  if (isPanel) {
    return (
      <div className={`geo-filters geo-filters--panel ${className}`.trim()}>
        <PanelFilterField
          fieldId={`${filterId}-country`}
          label={t('geo.country')}
          value={value.country}
          placeholder={t('geo.anyCountry')}
          options={countryOptions}
          disabled={!catalog}
          alwaysExpanded
          onChange={(next) => void patch({ country: next })}
        />
        <PanelFilterField
          fieldId={`${filterId}-region`}
          label={t('geo.region')}
          value={value.region}
          placeholder={t('geo.anyRegion')}
          options={regionOptions}
          disabled={!value.country}
          open={openField === 'region'}
          onOpenChange={(next) => setOpenField(next ? 'region' : null)}
          onChange={(next) => void patch({ region: next })}
        />
        {showProvince ? (
          <PanelFilterField
            fieldId={`${filterId}-province`}
            label={t('geo.province')}
            value={value.province}
            placeholder={t('geo.anyProvince')}
            options={provinceOptions}
            disabled={!value.region}
            open={openField === 'province'}
            onOpenChange={(next) => setOpenField(next ? 'province' : null)}
            onChange={(next) => void patch({ province: next })}
          />
        ) : null}
        <PanelFilterField
          fieldId={`${filterId}-city`}
          label={t('geo.city')}
          value={value.city}
          placeholder={t('geo.anyCity')}
          options={cityOptions}
          disabled={!value.region}
          open={openField === 'city'}
          onOpenChange={(next) => setOpenField(next ? 'city' : null)}
          onChange={(next) => void patch({ city: next })}
        />
        <PanelFilterField
          fieldId={`${filterId}-radius`}
          label={t('geo.radius')}
          value={value.radius}
          placeholder={t(`geo.radius.${value.radius}` as TranslationKey)}
          options={radiusOptions}
          includeEmpty={false}
          open={openField === 'radius'}
          onOpenChange={(next) => setOpenField(next ? 'radius' : null)}
          onChange={(next) => void patch({ radius: next as GeoRadiusMode, fromGps: value.fromGps })}
        />
        {gpsBlock}
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="amazon-filter-group">
        <label>{t('geo.country')}</label>
        <select
          className="select-glass geo-filter-select"
          value={value.country}
          onChange={(e) => void patch({ country: e.target.value })}
          disabled={!catalog}
        >
          <option value="">{t('geo.anyCountry')}</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="amazon-filter-group">
        <label>{t('geo.region')}</label>
        <select
          className="select-glass geo-filter-select"
          value={value.region}
          onChange={(e) => void patch({ region: e.target.value })}
          disabled={!value.country}
        >
          <option value="">{t('geo.anyRegion')}</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {showProvince ? (
        <div className="amazon-filter-group">
          <label>{t('geo.province')}</label>
          <select
            className="select-glass geo-filter-select"
            value={value.province}
            onChange={(e) => void patch({ province: e.target.value })}
            disabled={!value.region}
          >
            <option value="">{t('geo.anyProvince')}</option>
            {provinces.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="amazon-filter-group">
        <label>{t('geo.city')}</label>
        <select
          className="select-glass geo-filter-select"
          value={value.city}
          onChange={(e) => void patch({ city: e.target.value })}
          disabled={!value.region}
        >
          <option value="">{t('geo.anyCity')}</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="amazon-filter-group">
        <label>{t('geo.radius')}</label>
        <select
          className="select-glass geo-filter-select"
          value={value.radius}
          onChange={(e) => void patch({ radius: e.target.value as GeoRadiusMode, fromGps: value.fromGps })}
        >
          {GEO_RADIUS_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {t(`geo.radius.${opt.id}` as TranslationKey)}
            </option>
          ))}
        </select>
      </div>

      {gpsBlock}
    </div>
  )
}

export { EMPTY_GEO_SELECTION }
