import { Filter, Search, X } from 'lucide-react'
import { useMemo } from 'react'
import {
  COMMERCIAL_FOCUS_COUNTRIES,
  dimarketParentCategoryOptions,
} from '../../lib/commercialAgents/categories'
import type { CommercialSearchFilters } from '../../lib/commercialAgents/types'
import type { TranslateFn } from '../../lib/i18n'
import { useApp } from '../../contexts/AppContext'

const inputClass =
  'w-full rounded-xl border border-[rgba(148,163,184,0.35)] bg-white px-3 py-2.5 text-[13px] text-[#2f2a24] outline-none transition focus:border-[#2f2a24] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]'

export function CommercialAgentsFilters({
  value,
  onChange,
  onApply,
  open,
  onOpenChange,
  t,
  mode = 'all',
}: {
  value: CommercialSearchFilters
  onChange: (next: CommercialSearchFilters) => void
  onApply: () => void
  open: boolean
  onOpenChange: (v: boolean) => void
  t: TranslateFn
  mode?: 'all' | 'manufacturers' | 'agents' | 'opportunities'
}) {
  const { language } = useApp()
  const categoryOptions = useMemo(
    () => dimarketParentCategoryOptions(language.code),
    [language.code],
  )

  const panel = (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">
          {t('commercialAgents.search')}
        </span>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-400)]" />
          <input
            className={`${inputClass} pl-9`}
            value={value.query}
            onChange={(e) => onChange({ ...value, query: e.target.value })}
            placeholder={t('commercialAgents.searchPlaceholder')}
          />
        </div>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">
            {t('commercialAgents.country')}
          </span>
          <select
            className={inputClass}
            value={value.country}
            onChange={(e) => onChange({ ...value, country: e.target.value })}
          >
            <option value="">{t('commercialAgents.anyCountry')}</option>
            {COMMERCIAL_FOCUS_COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">
            {t('commercialAgents.category')}
          </span>
          <select
            className={inputClass}
            value={value.category}
            onChange={(e) => onChange({ ...value, category: e.target.value })}
          >
            <option value="">{t('commercialAgents.anyCategory')}</option>
            {categoryOptions.map((opt) => (
              <option key={opt.slug} value={opt.slug}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">
            {t('commercialAgents.language')}
          </span>
          <input
            className={inputClass}
            value={value.language}
            onChange={(e) => onChange({ ...value, language: e.target.value })}
            placeholder="EN, ES, DE, UA…"
          />
        </label>

        {(mode === 'all' || mode === 'opportunities' || mode === 'manufacturers') && (
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">
              {t('commercialAgents.exclusivity')}
            </span>
            <select
              className={inputClass}
              value={value.exclusive}
              onChange={(e) =>
                onChange({
                  ...value,
                  exclusive: e.target.value as CommercialSearchFilters['exclusive'],
                })
              }
            >
              <option value="">{t('commercialAgents.any')}</option>
              <option value="exclusive">{t('commercialAgents.exclusive')}</option>
              <option value="non_exclusive">{t('commercialAgents.nonExclusive')}</option>
            </select>
          </label>
        )}
      </div>

      <div className="flex flex-wrap gap-4 pt-1">
        <label className="inline-flex items-center gap-2 text-sm text-[var(--ink-700)]">
          <input
            type="checkbox"
            checked={value.verifiedOnly}
            onChange={(e) => onChange({ ...value, verifiedOnly: e.target.checked })}
          />
          {t('commercialAgents.verifiedOnly')}
        </label>
        {(mode === 'all' || mode === 'agents') && (
          <label className="inline-flex items-center gap-2 text-sm text-[var(--ink-700)]">
            <input
              type="checkbox"
              checked={value.availableOnly}
              onChange={(e) => onChange({ ...value, availableOnly: e.target.checked })}
            />
            {t('commercialAgents.availableOnly')}
          </label>
        )}
      </div>

      <button type="button" onClick={onApply} className="btn-primary w-full rounded-full px-5 py-2.5 text-sm sm:w-auto">
        {t('commercialAgents.applyFilters')}
      </button>
    </div>
  )

  return (
    <>
      <div className="hidden rounded-2xl border border-[var(--line-200)] bg-white p-4 md:block">{panel}</div>

      <div className="md:hidden">
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--line-200)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--ink-800)]"
        >
          <Filter className="h-4 w-4" />
          {t('commercialAgents.filters')}
        </button>
        {open ? (
          <div className="fixed inset-0 z-[80] flex flex-col bg-black/40" role="dialog" aria-modal>
            <div className="mt-auto max-h-[85vh] overflow-y-auto rounded-t-3xl bg-[#fffaf6] p-5 pb-28">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--ink-900)]">{t('commercialAgents.filters')}</h2>
                <button type="button" onClick={() => onOpenChange(false)} aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {panel}
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}
