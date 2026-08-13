import { useEffect, useState } from 'react'
import { ArrowLeft, Download, ExternalLink, Loader2 } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { getPublishedLegalDocument, type PublishedLegalDocument } from '../lib/officialSources/api'
import {
  buildLegalDocumentPdfHtml,
  openLegalDocumentPdfPrint,
} from '../lib/officialSources/legalDocumentPdf'
import { buildOfficialPointerMarkdown } from '../lib/officialSources/pointerTemplate'
import { getStaticOfficialDocument } from '../lib/officialSources/staticCatalog'
import { DocumentFreshnessBadge, LegalContentDisclaimer } from '../components/officialSources/DocumentFreshnessBadge'

function renderMarkdown(md: string): string {
  return md
    .replace(/^# (.+)$/gm, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
    .replace(/^## (.+)$/gm, '<h3 class="text-lg font-bold mt-3 mb-2">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<p class="ml-3 text-sm leading-6">• $1</p>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-2 border-[#d2d2d7] pl-3 text-sm text-[#6e6e73]">$1</blockquote>')
    .replace(/\n\n/g, '</p><p class="mt-3 text-sm leading-6 text-[#1d1d1f]">')
}

function staticDocAsPublished(docKey: string, lang: string): PublishedLegalDocument | null {
  const s = getStaticOfficialDocument(docKey)
  if (!s) return null
  const title = lang === 'uk' ? s.titleUk : s.title
  const body = buildOfficialPointerMarkdown({
    sourceName: s.source_name,
    sourceUrl: s.source_url,
    jurisdiction: s.jurisdiction,
  })
  return {
    id: `static-${s.doc_key}`,
    doc_key: s.doc_key,
    title,
    doc_kind: s.doc_kind,
    country_code: s.country_code,
    region: null,
    jurisdiction: s.jurisdiction,
    primary_source_id: null,
    verification_status: 'verified',
    current_version_id: 'static-v1',
    next_verification_at: new Date().toISOString(),
    last_verified_at: new Date().toISOString(),
    is_published: true,
    official_sources: {
      source_name: s.source_name,
      source_url: s.source_url,
      trust_tier: s.trust_tier,
      last_checked_at: null,
      verification_status: 'verified',
    },
    current_version: {
      id: 'static-v1',
      document_id: `static-${s.doc_key}`,
      version_number: '2026.08-pointer',
      title,
      body_markdown: body,
      body_html: null,
      source_id: null,
      source_url: s.source_url,
      published_at: new Date().toISOString(),
      effective_from: new Date().toISOString(),
      effective_until: null,
      verified_at: new Date().toISOString(),
      status: 'published',
      change_summary: 'Static official source pointer',
    },
  }
}

type Props = { docKey: string }

export function LegalDocumentDetail({ docKey }: Props) {
  const { t, language } = useApp()
  const [loading, setLoading] = useState(true)
  const [doc, setDoc] = useState<PublishedLegalDocument | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const remote = await getPublishedLegalDocument(docKey)
        setDoc(remote ?? staticDocAsPublished(docKey, language.code))
      } catch (err) {
        setDoc(staticDocAsPublished(docKey, language.code))
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setLoading(false)
      }
    })()
  }, [docKey, language.code])

  if (loading) {
    return (
      <div className="layout-page-content flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[#86868b]" />
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="layout-page-content py-16 text-center">
        <p className="text-sm text-[#6e6e73]">{t('osm.public.notFound')}</p>
        <button
          type="button"
          onClick={() => navigateTo('/category/official-documents')}
          className="mt-4 text-sm font-semibold text-[#007185] hover:underline"
        >
          {t('osm.public.backToList')}
        </button>
      </div>
    )
  }

  const version = doc.current_version
  const body = version?.body_markdown ?? ''
  const sourceUrl = version?.source_url ?? doc.official_sources?.source_url

  const downloadPdf = () => {
    if (!version?.body_markdown) return
    const html = buildLegalDocumentPdfHtml({
      title: doc.title,
      bodyMarkdown: version.body_markdown,
      meta: {
        documentName: doc.title,
        version: version.version_number,
        jurisdiction: doc.jurisdiction ?? doc.country_code,
        generatedAt: new Date(),
        sourceName: doc.official_sources?.source_name,
        sourceUrl: sourceUrl ?? undefined,
        lastVerifiedAt: doc.last_verified_at ?? version.verified_at,
      },
      disclaimerLines: [t('osm.disclaimer.accuracy'), t('osm.disclaimer.notAdvice')],
    })
    openLegalDocumentPdfPrint(html)
  }

  return (
    <div className="layout-page-content py-8 pb-24 lg:pb-8">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => navigateTo('/category/official-documents')}
          className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-[#007185] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('osm.public.backToList')}
        </button>

        <header className="mb-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1d1d1f]">{doc.title}</h1>
          <p className="mt-1 text-sm text-[#6e6e73]">
            {doc.country_code}
            {doc.jurisdiction ? ` · ${doc.jurisdiction}` : ''}
            {version?.version_number ? ` · v${version.version_number}` : ''}
          </p>
        </header>

        <DocumentFreshnessBadge
          verificationStatus={doc.verification_status}
          lastVerifiedAt={doc.last_verified_at ?? version?.verified_at ?? doc.official_sources?.last_checked_at}
          nextVerificationAt={doc.next_verification_at}
          sourceName={doc.official_sources?.source_name}
          sourceUrl={sourceUrl}
          trustTier={doc.official_sources?.trust_tier}
        />

        {error && !body ? (
          <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {error}
          </p>
        ) : null}

        {body ? (
          <article
            className="prose-like mt-6 rounded-2xl border border-[#e8e8ed] bg-white p-5"
            dangerouslySetInnerHTML={{
              __html: `<p class="text-sm leading-6 text-[#1d1d1f]">${renderMarkdown(body)}</p>`,
            }}
          />
        ) : null}

        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#1d1d1f] px-4 py-2 text-sm font-semibold text-white hover:bg-black"
          >
            <ExternalLink className="h-4 w-4" />
            {t('osm.freshness.openSource')}
          </a>
        ) : null}

        {body ? (
          <button
            type="button"
            onClick={downloadPdf}
            className="mt-4 ml-0 inline-flex items-center gap-2 rounded-full border border-[#d2d2d7] px-4 py-2 text-sm font-semibold hover:bg-[#f5f5f7] sm:ml-3"
          >
            <Download className="h-4 w-4" />
            {t('osm.public.downloadPdf')}
          </button>
        ) : null}

        <div className="mt-6">
          <LegalContentDisclaimer />
        </div>
      </div>
    </div>
  )
}
