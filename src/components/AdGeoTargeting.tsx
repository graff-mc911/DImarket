import { useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
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

function ChipList({
  items,
  onRemove,
}: {
  items: string[]
  onRemove: (item: string) => void
}) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="inline-flex items-center gap-1 rounded-full bg-[rgba(99,102,241,0.12)] px-3 py-1 text-xs font-semibold text-[#4338ca]"
        >
          {item}
          <button
            type="button"
            onClick={() => onRemove(item)}
            className="rounded-full p-0.5 hover:bg-[rgba(99,102,241,0.2)]"
            aria-label="Remove"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
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

  const [draftCountry, setDraftCountry] = useState('')
  const [draftRegion, setDraftRegion] = useState('')
  const [draftCity, setDraftCity] = useState('')

  const draftRegions = draftCountry ? catalogRegionsForCountry(geoData, draftCountry) : []
  const draftCities = draftCountry && draftRegion ? catalogCitiesForRegion(geoData, draftCountry, draftRegion) : []

  const resetDraft = () => {
    setDraftCountry('')
    setDraftRegion('')
    setDraftCity('')
  }

  const addCountry = () => {
    if (!draftCountry || selectedCountries.includes(draftCountry)) return
    onCountriesChange([...selectedCountries, draftCountry])
    resetDraft()
  }

  const addRegion = () => {
    if (!draftCountry || !draftRegion || selectedRegions.includes(draftRegion)) return
    if (!selectedCountries.includes(draftCountry)) {
      onCountriesChange([...selectedCountries, draftCountry])
    }
    onRegionsChange([...selectedRegions, draftRegion])
    setDraftRegion('')
    setDraftCity('')
  }

  const addCity = () => {
    if (!draftCountry || !draftRegion || !draftCity || selectedCities.includes(draftCity)) return
    if (!selectedCountries.includes(draftCountry)) {
      onCountriesChange([...selectedCountries, draftCountry])
    }
    if (!selectedRegions.includes(draftRegion)) {
      onRegionsChange([...selectedRegions, draftRegion])
    }
    onCitiesChange([...selectedCities, draftCity])
    setDraftCity('')
  }

  const handleCountryChange = (val: string) => {
    setDraftCountry(val)
    setDraftRegion('')
    setDraftCity('')
  }

  const handleRegionChange = (val: string) => {
    setDraftRegion(val)
    setDraftCity('')
  }

  if (geoMode === 'countries') {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <select
            value={draftCountry}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="select-glass"
          >
            <option value="">{t('register.selectCountry')}</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button type="button" onClick={addCountry} disabled={!draftCountry} className="btn-secondary rounded-full px-4">
            <Plus className="h-4 w-4" />
            {t('advertising.geo.add')}
          </button>
        </div>
        <ChipList
          items={selectedCountries}
          onRemove={(c) => onCountriesChange(selectedCountries.filter((x) => x !== c))}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#6f665d]">{t('register.selectCountry')}</label>
          <select
            value={draftCountry}
            onChange={(e) => handleCountryChange(e.target.value)}
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
            value={draftRegion}
            onChange={(e) => handleRegionChange(e.target.value)}
            disabled={!draftCountry || draftRegions.length === 0}
            className="select-glass w-full disabled:opacity-50"
          >
            <option value="">{t('register.selectRegion')}</option>
            {draftRegions.map((r) => (
              <option key={r.name} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        {geoMode === 'cities' && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#6f665d]">{t('register.selectCity')}</label>
            <select
              value={draftCity}
              onChange={(e) => setDraftCity(e.target.value)}
              disabled={!draftRegion || draftCities.length === 0}
              className="select-glass w-full disabled:opacity-50"
            >
              <option value="">{t('register.selectCity')}</option>
              {draftCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {geoMode === 'regions' && (
          <button
            type="button"
            onClick={addRegion}
            disabled={!draftCountry || !draftRegion}
            className="btn-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            {t('advertising.geo.addRegion')}
          </button>
        )}
        {geoMode === 'cities' && (
          <button
            type="button"
            onClick={addCity}
            disabled={!draftCountry || !draftRegion || !draftCity}
            className="btn-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            {t('advertising.geo.addCity')}
          </button>
        )}
      </div>

      {(geoMode === 'regions' || geoMode === 'cities') && selectedCountries.length > 0 && (
        <ChipList
          items={selectedCountries}
          onRemove={(c) => {
            onCountriesChange(selectedCountries.filter((x) => x !== c))
            onRegionsChange([])
            onCitiesChange([])
          }}
        />
      )}
      {geoMode === 'regions' && (
        <ChipList
          items={selectedRegions}
          onRemove={(r) => onRegionsChange(selectedRegions.filter((x) => x !== r))}
        />
      )}
      {geoMode === 'cities' && (
        <ChipList
          items={selectedCities}
          onRemove={(c) => onCitiesChange(selectedCities.filter((x) => x !== c))}
        />
      )}
    </div>
  )
}
