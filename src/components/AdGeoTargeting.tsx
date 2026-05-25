import { useMemo, useState } from 'react'
import { useApp } from '../contexts/AppContext'
import type { AdGeoCountry, GeoMode } from '../lib/adGeoCatalog'
import {
  catalogCitiesForRegion,
  catalogCountries,
  catalogRegionsForCountry,
} from '../lib/adGeoCatalog'

type AdGeoTargetingProps = {
  geoMode: GeoMode
  geoData: AdGeoCountry[]
  selectedCountries: string[]
  selectedRegions: string[]
  selectedCities: string[]
  onCountriesChange: (values: string[]) => void
  onRegionsChange: (values: string[]) => void
  onCitiesChange: (values: string[]) => void
}

function CheckboxGrid({
  options,
  selected,
  onToggle,
  emptyText,
}: {
  options: string[]
  selected: string[]
  onToggle: (value: string) => void
  emptyText: string
}) {
  if (options.length === 0) {
    return <p className="text-sm text-[#9a8776]">{emptyText}</p>
  }

  return (
    <div className="max-h-64 overflow-y-auto rounded-[18px] border border-[rgba(148,163,184,0.2)] bg-[rgba(255,255,255,0.55)] p-2">
      <div className="grid gap-1 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option}
            className="flex cursor-pointer items-center gap-2.5 rounded-[14px] px-3 py-2 text-sm text-[#2f2a24] hover:bg-[rgba(99,102,241,0.08)]"
          >
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => onToggle(option)}
              className="h-4 w-4 shrink-0"
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

export function AdGeoTargeting({
  geoMode,
  geoData,
  selectedCountries,
  selectedRegions,
  selectedCities,
  onCountriesChange,
  onRegionsChange,
  onCitiesChange,
}: AdGeoTargetingProps) {
  const { t } = useApp()
  const countries = useMemo(() => catalogCountries(geoData), [geoData])
  const countriesWithRegions = useMemo(
    () => geoData.filter((c) => c.regions.length > 0),
    [geoData],
  )

  const [activeCountry, setActiveCountry] = useState('')
  const [activeRegion, setActiveRegion] = useState('')

  const regionsForCountry = activeCountry ? catalogRegionsForCountry(geoData, activeCountry) : []
  const regionNames = regionsForCountry.map((r) => r.name)
  const citiesForRegion =
    activeCountry && activeRegion ? catalogCitiesForRegion(geoData, activeCountry, activeRegion) : []

  const syncCountriesFromRegions = (regions: string[]) => {
    const fromRegions = geoData
      .filter((c) => c.regions.some((r) => regions.includes(r.name)))
      .map((c) => c.name)
    onCountriesChange(fromRegions)
  }

  const handleCountryFocus = (country: string) => {
    setActiveCountry(country)
    setActiveRegion('')
    if (geoMode === 'cities') onCitiesChange([])
  }

  const toggleCountry = (name: string) => {
    const next = selectedCountries.includes(name)
      ? selectedCountries.filter((c) => c !== name)
      : [...selectedCountries, name]
    onCountriesChange(next)
    if (geoMode !== 'countries') {
      onRegionsChange(selectedRegions.filter((r) => {
        const owner = geoData.find((c) => c.regions.some((reg) => reg.name === r))
        return owner ? next.includes(owner.name) : false
      }))
      onCitiesChange([])
    }
  }

  const toggleRegion = (name: string) => {
    if (!activeCountry) return
    const next = selectedRegions.includes(name)
      ? selectedRegions.filter((r) => r !== name)
      : [...selectedRegions, name]
    onRegionsChange(next)
    syncCountriesFromRegions(next)
    if (geoMode === 'cities') onCitiesChange([])
  }

  const toggleCity = (name: string) => {
    const next = selectedCities.includes(name)
      ? selectedCities.filter((c) => c !== name)
      : [...selectedCities, name]
    onCitiesChange(next)
    if (activeCountry && !selectedCountries.includes(activeCountry)) {
      onCountriesChange([...selectedCountries, activeCountry])
    }
    if (activeRegion && !selectedRegions.includes(activeRegion)) {
      const nextRegions = [...selectedRegions, activeRegion]
      onRegionsChange(nextRegions)
      syncCountriesFromRegions(nextRegions)
    }
  }

  if (geoMode === 'countries') {
    return (
      <div className="space-y-3">
        <p className="text-xs leading-5 text-[#6f665d]">{t('advertising.geo.countriesHint')}</p>
        <CheckboxGrid
          options={countries}
          selected={selectedCountries}
          onToggle={toggleCountry}
          emptyText={t('advertising.geo.noneAvailable')}
        />
        {selectedCountries.length > 0 && (
          <p className="text-xs font-semibold text-[#5f5a54]">
            {t('advertising.geo.selected')}: {selectedCountries.length}
          </p>
        )}
      </div>
    )
  }

  if (geoMode === 'regions') {
    return (
      <div className="space-y-4">
        <p className="text-xs leading-5 text-[#6f665d]">{t('advertising.geo.regionsHint')}</p>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#6f665d]">{t('register.selectCountry')}</label>
          <select
            value={activeCountry}
            onChange={(e) => handleCountryFocus(e.target.value)}
            className="select-glass w-full"
          >
            <option value="">{t('register.selectCountry')}</option>
            {countriesWithRegions.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {activeCountry && regionNames.length === 0 && (
          <p className="text-sm text-[#9a8776]">{t('advertising.geo.noRegionsYet')}</p>
        )}
        {activeCountry && regionNames.length > 0 && (
          <>
            <p className="text-xs font-semibold text-[#6f665d]">
              {t('advertising.geo.selectRegions')} — {activeCountry}
              {` (${regionNames.length})`}
            </p>
            <CheckboxGrid
              options={regionNames}
              selected={selectedRegions}
              onToggle={toggleRegion}
              emptyText={t('advertising.geo.noneAvailable')}
            />
          </>
        )}
        {selectedRegions.length > 0 && (
          <p className="text-xs font-semibold text-[#5f5a54]">
            {t('advertising.geo.selected')}: {selectedRegions.length}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-xs leading-5 text-[#6f665d]">{t('advertising.geo.citiesHint')}</p>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#6f665d]">{t('register.selectCountry')}</label>
          <select
            value={activeCountry}
            onChange={(e) => handleCountryFocus(e.target.value)}
            className="select-glass w-full"
          >
            <option value="">{t('register.selectCountry')}</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#6f665d]">{t('register.selectRegion')}</label>
          <select
            value={activeRegion}
            onChange={(e) => {
              setActiveRegion(e.target.value)
              onCitiesChange([])
            }}
            disabled={!activeCountry || regionNames.length === 0}
            className="select-glass w-full disabled:opacity-50"
          >
            <option value="">{t('register.selectRegion')}</option>
            {regionNames.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>
      {activeCountry && activeRegion && (
        <>
          <p className="text-xs font-semibold text-[#6f665d]">
            {t('advertising.geo.selectCities')} — {activeRegion}
          </p>
          <CheckboxGrid
            options={citiesForRegion}
            selected={selectedCities}
            onToggle={toggleCity}
            emptyText={t('advertising.geo.noneAvailable')}
          />
        </>
      )}
      {selectedCities.length > 0 && (
        <p className="text-xs font-semibold text-[#5f5a54]">
          {t('advertising.geo.selected')}: {selectedCities.length}
        </p>
      )}
    </div>
  )
}
