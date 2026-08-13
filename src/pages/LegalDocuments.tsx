import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, FileText, Loader2 } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import {
  listPublishedLegalDocuments,
  type PublishedLegalDocument,
} from '../lib/officialSources/api'
import { STATIC_OFFICIAL_DOCUMENTS } from '../lib/officialSources/staticCatalog'
import { DocumentFreshnessBadge, LegalContentDisclaimer } from '../components/officialSources/DocumentFreshnessBadge'

function staticAsPublished(lang: string): PublishedLegalDocument[] {
  return STATIC_OFFICIAL_DOCUMENTS.map((d) => ({
    id: `static-${d.doc_key}`,
    doc_key: d.doc_key,
    title: lang === 'uk' ? d.titleUk : d.title,
    doc_kind: d.doc_kind,
    country_code: d.country_code,
    region: null,
    jurisdiction: d.jurisdiction,
    primary_source_id: null,
    // Static fallback is NOT OSM-verified — never fake "verified" + today's date.
    verification_status: 'needs_research',
    current_version_id: null,
    next_verification_at: null,
    last_verified_at: null,
    is_published: true,
    official_sources: {
      source_name: d.source_name,
      source_url: d.source_url,
      trust_tier: d.trust_tier,
      last_checked_at: null,
      verification_status: 'needs_research',
    },
  }))
}

export function LegalDocuments() {
  const { t, language } = useApp()
  const [loading, setLoading] = useState(true)
  const [docs, setDocs] = useState<PublishedLegalDocument[]>([])
  const [countryFilter, setCountryFilter] = useState('')
  const [kindFilter, setKindFilter] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fromStatic, setFromStatic] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const remote = await listPublishedLegalDocuments()
        if (remote.length > 0) {
          setDocs(remote)
          setFromStatic(false)
        } else {
          setDocs(staticAsPublished(language.code))
          setFromStatic(true)
        }
      } catch (err) {
        setDocs(staticAsPublished(language.code))
        setFromStatic(true)
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setLoading(false)
      }
    })()
  }, [language.code])

  const countries = useMemo(
    () => [...new Set(docs.map((d) => d.country_code))].sort(),
    [docs],
  )

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      if (countryFilter && d.country_code !== countryFilter) return false
      if (kindFilter && d.doc_kind !== kindFilter) return false
      return true
    })
  }, [docs, countryFilter, kindFilter])

  const kinds = useMemo(
    () => [...new Set(docs.map((d) => d.doc_kind))].sort(),
    [docs],
  )

  if (loading) {
    return (
      <div className="layout-page-content flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[#86868b]" />
      </div>
    )
  }

  return (
    <div className="layout-page-content py-8 pb-24 lg:pb-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#86868b]">
            {t('osm.public.categoryEyebrow')}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#1d1d1f]">
            {t('osm.public.title')}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#6e6e73]">{t('osm.public.subtitle')}</p>
          {fromStatic ? (
            <p className="mt-2 text-xs text-[#6e6e73]">{t('osm.public.staticCatalogNote')}</p>
          ) : null}
          {countries.length > 1 || kinds.length > 1 ? (
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              {countries.length > 1 ? (
                <label className="inline-flex items-center gap-2">
                  <span className="font-semibold text-[#1d1d1f]">{t('osm.public.filterCountry')}</span>
                  <select
                    value={countryFilter}
                    onChange={(e) => setCountryFilter(e.target.value)}
                    className="rounded-lg border border-[#d2d2d7] px-2 py-1 text-sm"
                  >
                    <option value="">{t('osm.public.filterAll')}</option>
                    {countries.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              {kinds.length > 1 ? (
                <label className="inline-flex items-center gap-2">
                  <span className="font-semibold text-[#1d1d1f]">{t('osm.public.filterKind')}</span>
                  <select
                    value={kindFilter}
                    onChange={(e) => setKindFilter(e.target.value)}
                    className="rounded-lg border border-[#d2d2d7] px-2 py-1 text-sm"
                  >
                    <option value="">{t('osm.public.filterAllKinds')}</option>
                    {kinds.map((kind) => (
                      <option key={kind} value={kind}>
                        {kind}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
          ) : null}
        </header>

        {error && !fromStatic ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {error}
          </p>
        ) : null}

        <ul className="space-y-3">
          {filtered.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-[#d2d2d7] px-4 py-8 text-center text-sm text-[#86868b]">
              {t('osm.public.empty')}
            </li>
          ) : (
            filtered.map((doc) => (
              <li key={doc.id}>
                <button
                  type="button"
                  onClick={() => navigateTo(`/legal-documents/${doc.doc_key}`)}
                  className="w-full rounded-2xl border border-[#e8e8ed] bg-white p-4 text-left transition hover:border-[#007185]/40 hover:shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 h-5 w-5 shrink-0 text-[#1d1d1f]" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#1d1d1f]">{doc.title}</p>
                      <p className="mt-0.5 text-xs text-[#6e6e73]">
                        {doc.country_code}
                        {doc.region ? ` · ${doc.region}` : ''} · {doc.doc_kind}
                      </p>
                      <div className="mt-2">
                        <DocumentFreshnessBadge
                          compact
                          verificationStatus={doc.verification_status}
                          lastVerifiedAt={doc.last_verified_at ?? doc.official_sources?.last_checked_at}
                          nextVerificationAt={doc.next_verification_at}
                        />
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 shrink-0 text-[#86868b]" aria-hidden />
                  </div>
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="mt-6">
          <LegalContentDisclaimer />
        </div>
      </div>
    </div>
  )
}
