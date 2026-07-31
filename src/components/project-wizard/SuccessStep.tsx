import { CheckCircle2, Copy, ExternalLink, Share2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { MatchingTeaser } from './MatchingTeaser'

type SuccessStepProps = {
  projectId: string
  labels: {
    title: string
    subtitle: string
    projectId: string
    share: string
    copied: string
    track: string
    matches: string
    matchingTitle: string
    invite: string
    invited: string
    matchingEmpty: string
  }
  onTrack: () => void
  onMatches: () => void
}

export function SuccessStep({ projectId, labels, onTrack, onMatches }: SuccessStepProps) {
  const [copied, setCopied] = useState(false)
  const [show, setShow] = useState(false)
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/project/${projectId}/matches`
      : `https://dimarket.app/project/${projectId}/matches`

  useEffect(() => {
    const t = window.setTimeout(() => setShow(true), 40)
    return () => window.clearTimeout(t)
  }, [])

  const onShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'DImarket project', url: shareUrl })
        return
      } catch {
        /* fall through */
      }
    }
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 text-center">
      <div
        className={
          'mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 transition duration-700 ' +
          (show ? 'scale-100 opacity-100' : 'scale-50 opacity-0')
        }
        aria-hidden
      >
        <CheckCircle2
          className={
            'h-12 w-12 text-emerald-600 transition duration-700 ' +
            (show ? 'scale-100' : 'scale-75')
          }
        />
      </div>
      <div>
        <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-[#1d1d1f]">
          {labels.title}
        </h2>
        <p className="mt-2 text-[15px] text-[#6e6e73]">{labels.subtitle}</p>
      </div>

      <div className="rounded-[20px] bg-[#f5f5f7] px-4 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
          {labels.projectId}
        </p>
        <p className="mt-1 break-all font-mono text-[13px] font-semibold text-[#1d1d1f]">
          {projectId}
        </p>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(projectId)
            setCopied(true)
            window.setTimeout(() => setCopied(false), 2000)
          }}
          className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[#6e6e73]"
        >
          <Copy className="h-3.5 w-3.5" aria-hidden />
          {copied ? labels.copied : 'Copy ID'}
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => void onShare()}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-6 py-3 text-[15px] font-semibold text-white"
        >
          <Share2 className="h-4 w-4" aria-hidden />
          {labels.share}
        </button>
        <button
          type="button"
          onClick={onTrack}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[#e8e8ed] px-6 py-3 text-[15px] font-semibold text-[#1d1d1f]"
        >
          <ExternalLink className="h-4 w-4" aria-hidden />
          {labels.track}
        </button>
        <button
          type="button"
          onClick={onMatches}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[#e8e8ed] px-6 py-3 text-[15px] font-semibold text-[#1d1d1f]"
        >
          {labels.matches}
        </button>
      </div>

      <MatchingTeaser
        projectId={projectId}
        labels={{
          title: labels.matchingTitle,
          invite: labels.invite,
          invited: labels.invited,
          empty: labels.matchingEmpty,
          viewAll: labels.matches,
        }}
      />
    </div>
  )
}
