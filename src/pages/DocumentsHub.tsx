import { useMemo } from 'react'
import { ChevronRight, FileText, MapPin } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { tStored } from '../lib/i18n'
import { navigateTo } from '../lib/navigation'
import { appendLocationToPath, formatGlobalLocationLabel } from '../lib/globalLocation'
import { documentDisplayDescription, documentDisplayTitle } from '../lib/documents/display'
import { DOCUMENTS_SUBCATEGORY_ORDER } from '../lib/documents/catalog'
import { documentSeoPath } from '../lib/documents/types'
import { jurisdictionFromLocation } from '../lib/documents/location'
import { listDocuments } from '../lib/documents/query'
import type { DocumentsSubcategorySlug } from '../lib/documents/types'

type Props = {
  subcategory?: DocumentsSubcategorySlug | null
}

export function DocumentsHub({ subcategory = null }: Props) {
  const { t, location, language } = useApp()
  const jurisdiction = useMemo(() => jurisdictionFromLocation(location), [location])
  const locationLabel =
    formatGlobalLocationLabel(location, t('dimarket.loc.all-europe')) || t('docs.location.any')

  const docs = useMemo(
    () => listDocuments({ subcategory, jurisdiction }),
    [subcategory, jurisdiction],
  )

  const subMeta = subcategory
    ? DOCUMENTS_SUBCATEGORY_ORDER.find((s) => s.slug === subcategory)
    : null

  return (
    <div className="layout-page-content py-8 pb-24 lg:pb-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8a8178]">
            {t('docs.categoryEyebrow')}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#2f2a24]">
            {subMeta ? tStored(t, subMeta.titleKey) : t('docs.hub.title')}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#6f665d]">
            {subMeta ? tStored(t, subMeta.descriptionKey) : t('docs.hub.subtitle')}
          </p>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#f3f0ea] px-3 py-1.5 text-xs text-[#2f2a24]">
            <MapPin className="h-3.5 w-3.5 text-[#8a8178]" aria-hidden />
            {t('docs.location.context')}: <strong>{locationLabel}</strong>
          </p>
          {jurisdiction.countryCode ? null : (
            <p className="mt-2 text-xs text-[#6f665d]">{t('docs.location.pickHint')}</p>
          )}
        </header>

        {!subcategory ? (
          <ul className="mb-8 grid gap-2 sm:grid-cols-2">
            {DOCUMENTS_SUBCATEGORY_ORDER.map((sub) => (
              <li key={sub.slug}>
                <button
                  type="button"
                  onClick={() =>
                    navigateTo(appendLocationToPath(`/documents/${sub.slug}`, location))
                  }
                  className="flex w-full items-center gap-3 rounded-2xl border border-[rgba(148,163,184,0.22)] bg-white px-4 py-3 text-left transition hover:border-[#007185]/40"
                >
                  <span className="text-xl" aria-hidden>
                    {sub.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-[#2f2a24]">{tStored(t, sub.titleKey)}</span>
                    <span className="block text-xs text-[#6f665d]">{tStored(t, sub.descriptionKey)}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#8a8178]" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <button
            type="button"
            className="mb-4 text-sm font-semibold text-[#007185]"
            onClick={() => navigateTo(appendLocationToPath('/documents', location))}
          >
            ← {t('docs.backToHub')}
          </button>
        )}

        <h2 className="mb-3 text-lg font-bold text-[#2f2a24]">
          {subcategory ? t('docs.list.title') : t('docs.list.featured')}
        </h2>

        {docs.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[rgba(148,163,184,0.35)] px-4 py-8 text-center text-sm text-[#8a8178]">
            {jurisdiction.countryCode
              ? t('docs.list.emptyForCountry')
              : t('docs.list.empty')}
          </p>
        ) : (
          <ul className="space-y-3">
            {docs.map((doc) => (
              <li key={doc.id}>
                <button
                  type="button"
                  onClick={() => navigateTo(appendLocationToPath(documentSeoPath(doc), location))}
                  className="w-full rounded-2xl border border-[rgba(148,163,184,0.22)] bg-white p-4 text-left transition hover:border-[#007185]/40 hover:shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 h-5 w-5 shrink-0 text-[#2f2a24]" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#2f2a24]">
                        {documentDisplayTitle(doc, language.code, t)}
                      </p>
                      <p className="mt-0.5 text-xs text-[#6f665d]">
                        {doc.jurisdiction} · {t(`docs.status.${doc.status}`)}
                      </p>
                      <p className="mt-1 text-sm text-[#6f665d] line-clamp-2">
                        {documentDisplayDescription(doc, language.code, t)}
                      </p>
                      {doc.relatedPortals?.length ? (
                        <p className="mt-2 text-xs font-semibold text-[#007185]">
                          {t('docs.vehicleCheck.title')} → {doc.relatedPortals[0]?.name}
                        </p>
                      ) : null}
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#8a8178]" aria-hidden />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-6 text-xs leading-5 text-[#6f665d]">{t('docs.disclaimer.short')}</p>
      </div>
    </div>
  )
}
