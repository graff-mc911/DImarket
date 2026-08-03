import { useMemo, useState } from 'react'
import { useApp } from '../contexts/AppContext'
import {
  getSubcategoryGroups,
  labelFor,
  subcategoryLabel,
} from '../lib/categoryCatalog'

type ConstructionWorkTypesPanelProps = {
  categorySlug?: string
  selected: string[]
  onChange: (slugs: string[]) => void
}

export function ConstructionWorkTypesPanel({
  categorySlug = 'construction',
  selected,
  onChange,
}: ConstructionWorkTypesPanelProps) {
  const { language, t } = useApp()
  const locale = language.code
  const [query, setQuery] = useState('')
  const groups = getSubcategoryGroups(categorySlug)

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return groups
    return groups
      .map((group) => ({
        ...group,
        subcategories: group.subcategories.filter((sub) => {
          const label = labelFor(sub.label, locale, sub.slug).toLowerCase()
          const groupLabel = labelFor(group.label, locale, group.slug).toLowerCase()
          return label.includes(q) || groupLabel.includes(q)
        }),
      }))
      .filter((g) => g.subcategories.length > 0)
  }, [groups, locale, query])

  if (!groups.length) return null

  const toggle = (slug: string) => {
    if (selected.includes(slug)) {
      onChange(selected.filter((s) => s !== slug))
    } else {
      onChange([...selected, slug])
    }
  }

  return (
    <div className="mt-5 rounded-[20px] border border-[rgba(99,102,241,0.15)] bg-[rgba(255,255,255,0.35)] p-4">
      <p className="text-sm font-bold text-[#2f2a24]">{t('categoryPicker.workTypesTitle')}</p>
      <p className="mt-1 text-xs text-[#6f665d]">{t('categoryPicker.workTypesHint')}</p>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('categoryPicker.searchWorkTypes')}
        className="input-glass mt-3 h-10 text-sm"
      />

      <div className="mt-3 max-h-64 space-y-3 overflow-y-auto pr-1">
        {filteredGroups.map((group) => (
          <div key={group.slug}>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-[#6366f1]">
              {labelFor(group.label, locale, group.slug)}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.subcategories.map((sub) => {
                const active = selected.includes(sub.slug)
                return (
                  <button
                    key={sub.slug}
                    type="button"
                    onClick={() => toggle(sub.slug)}
                    className={
                      'rounded-full px-3 py-1.5 text-xs font-semibold transition ' +
                      (active
                        ? 'bg-[#6366f1] text-white'
                        : 'border border-[rgba(99,102,241,0.25)] bg-white/60 text-[#4338ca] hover:bg-white')
                    }
                  >
                    {labelFor(sub.label, locale, sub.slug)}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {selected.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onChange([])}
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-[#6f665d] underline"
          >
            {t('categoryPicker.clearSubs')}
          </button>
          <p className="text-[11px] text-[#9a8776]">
            {t('categoryPicker.filterActive')}:{' '}
            {selected.map((s) => subcategoryLabel(categorySlug, s, locale)).join(', ')}
          </p>
        </div>
      )}
    </div>
  )
}
