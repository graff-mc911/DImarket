import { MessageCircle, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { MatchScoreBadge } from '../MatchScoreBadge'
import { ensureConversation } from '../../lib/chat/conversations'
import { sendChatMessage } from '../../lib/chat/messages'
import { fetchMatchScoresForListing } from '../../lib/matching'
import { navigateTo } from '../../lib/navigation'
import { useApp } from '../../contexts/AppContext'

type MatchRow = {
  score: number
  contractor: {
    id: string
    full_name: string | null
    location: string | null
    profile_photo?: string | null
    avatar_url?: string | null
    is_verified?: boolean | null
  } | null
}

type MatchingTeaserProps = {
  projectId: string
  labels: {
    title: string
    invite: string
    invited: string
    empty: string
    viewAll: string
  }
}

export function MatchingTeaser({ projectId, labels }: MatchingTeaserProps) {
  const { user, profile } = useApp()
  const [rows, setRows] = useState<MatchRow[]>([])
  const [loading, setLoading] = useState(true)
  const [invitingId, setInvitingId] = useState<string | null>(null)
  const [invited, setInvited] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const load = async () => {
      // Matching may still be writing — retry briefly
      for (let i = 0; i < 4; i++) {
        const data = await fetchMatchScoresForListing(projectId, 5)
        if (cancelled) return
        if (data?.length) {
          setRows(data as MatchRow[])
          setLoading(false)
          return
        }
        await new Promise((r) => setTimeout(r, 700))
      }
      if (!cancelled) {
        setRows([])
        setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [projectId])

  const invite = async (proId: string, proName: string) => {
    if (!user || invited[proId]) return
    setInvitingId(proId)
    try {
      const convId = await ensureConversation(proId, projectId)
      if (convId) {
        await sendChatMessage({
          conversationId: convId,
          senderId: user.id,
          senderName: profile?.full_name || user.email || 'Customer',
          recipientId: proId,
          listingId: projectId,
          content: `Hi ${proName || 'there'}, I'd like to invite you to quote on my project.`,
        })
        setInvited((s) => ({ ...s, [proId]: true }))
        navigateTo('/messages')
      } else {
        navigateTo(`/professional/${proId}`)
      }
    } finally {
      setInvitingId(null)
    }
  }

  return (
    <div className="mt-8 border-t border-[#f0f0f2] pt-6 text-left">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-[16px] font-semibold text-[#1d1d1f]">{labels.title}</h3>
        <button
          type="button"
          onClick={() => navigateTo(`/project/${projectId}/matches`)}
          className="text-[13px] font-semibold text-[#6e6e73] hover:text-[#1d1d1f]"
        >
          {labels.viewAll}
        </button>
      </div>

      {loading ? (
        <ul className="space-y-3" aria-busy="true" aria-label="Loading matches">
          {[1, 2, 3].map((i) => (
            <li
              key={i}
              className="flex animate-pulse items-center gap-3 rounded-[18px] border border-[#e8e8ed] bg-[#fafafa] p-3"
            >
              <div className="h-12 w-12 rounded-2xl bg-[#e8e8ed]" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/2 rounded bg-[#e8e8ed]" />
                <div className="h-3 w-1/3 rounded bg-[#e8e8ed]" />
              </div>
              <div className="h-8 w-16 rounded-full bg-[#e8e8ed]" />
            </li>
          ))}
        </ul>
      ) : rows.length === 0 ? (
        <p className="rounded-[18px] bg-[#f5f5f7] px-4 py-6 text-center text-[14px] text-[#86868b]">
          {labels.empty}
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => {
            const p = row.contractor
            if (!p) return null
            const photo = p.profile_photo || p.avatar_url
            const score = Math.round(Number(row.score))
            const name = p.full_name || 'Professional'
            return (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-3 rounded-[18px] border border-[#e8e8ed] bg-white p-3"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#f5f5f7]">
                  {photo ? (
                    <img src={photo} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <User className="h-5 w-5 text-[#86868b]" aria-hidden />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-[#1d1d1f]">{name}</p>
                  <p className="truncate text-[12px] text-[#86868b]">{p.location || 'Nearby'}</p>
                </div>
                <MatchScoreBadge score={score} />
                <button
                  type="button"
                  disabled={invitingId === p.id || invited[p.id]}
                  onClick={() => void invite(p.id, name)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#1d1d1f] px-3.5 py-2 text-[12px] font-semibold text-white disabled:opacity-50"
                  aria-label={`${labels.invite} ${name}`}
                >
                  <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                  {invited[p.id] ? labels.invited : invitingId === p.id ? '…' : labels.invite}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
