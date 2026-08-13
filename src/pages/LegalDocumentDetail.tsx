import { useEffect, useState } from 'react'
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { getPublishedLegalDocument, type PublishedLegalDocument } from '../lib/officialSources/api'
import { DocumentFreshnessBadge, LegalContentDisclaimer } from '../components/officialSources/DocumentFreshnessBadge'

function renderMarkdown(md: string): string {
  return md
    .replace(/^# (.+)$/gm, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p class="mt-3 text-sm leading-6 text-[#1d1d1f]">')
    .replace(/^(.+)$/gm, (line) =>
      line.startsWith('<h2') || line.startsWith('<p') ? line : line,
    )
}

type Props = { docKey: string }

export function LegalDocumentDetail({ docKey }: Props) {
  const { t } = useApp()
  const [loading, setLoading] = useState(true)
  const [doc, setDoc] = useState<PublishedLegalDocument | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        setDoc(await getPublishedLegalDocument(docKey))
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setLoading(false)
      }
    })()
  }, [docKey])

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
          onClick={() => navigateTo('/legal-documents')}
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

  return (
    <div className="layout-page-content py-8 pb-24 lg:pb-8">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => navigateTo('/legal-documents')}
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

        {error ? (
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

        <div className="mt-6">
          <LegalContentDisclaimer />
        </div>
      </div>
    </div>
  )
}
