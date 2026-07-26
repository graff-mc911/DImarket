import { useEffect, useState } from 'react'
import { Columns2, X } from 'lucide-react'
import {
  clearCompare,
  getCompareIds,
  removeFromCompare,
  subscribeCompare,
  MAX_COMPARE,
} from '../../lib/compare'
import { navigateTo } from '../../lib/navigation'
import { supabase } from '../../lib/supabase'

type Mini = { id: string; name: string; photo: string | null }

export function CompareBar() {
  const [ids, setIds] = useState<string[]>([])
  const [minis, setMinis] = useState<Mini[]>([])

  useEffect(() => {
    setIds(getCompareIds())
    return subscribeCompare(setIds)
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (!ids.length) {
        setMinis([])
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, profile_photo, avatar_url')
        .in('id', ids)
      if (cancelled) return
      const map = new Map(
        ((data || []) as Array<{
          id: string
          full_name: string | null
          profile_photo: string | null
          avatar_url: string | null
        }>).map((p) => [
          p.id,
          {
            id: p.id,
            name: p.full_name || 'Professional',
            photo: p.profile_photo || p.avatar_url,
          },
        ]),
      )
      setMinis(ids.map((id) => map.get(id) || { id, name: 'Professional', photo: null }))
    })()
    return () => {
      cancelled = true
    }
  }, [ids.join(',')])

  if (ids.length === 0) return null

  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 px-3 lg:bottom-4">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 rounded-[22px] border border-[#e8e8ed] bg-white/95 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#86868b]">
            <Columns2 className="h-3.5 w-3.5" />
            Compare · {ids.length}/{MAX_COMPARE}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {minis.map((m) => (
              <span
                key={m.id}
                className="inline-flex max-w-[160px] items-center gap-1.5 rounded-full border border-[#e8e8ed] bg-[#f5f5f7] py-1 pl-1 pr-2 text-[12px] font-medium text-[#1d1d1f]"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
                  {m.photo ? (
                    <img src={m.photo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-[#86868b]">
                      {m.name.slice(0, 1)}
                    </span>
                  )}
                </span>
                <span className="truncate">{m.name}</span>
                <button
                  type="button"
                  className="rounded-full p-0.5 text-[#86868b] hover:text-[#1d1d1f]"
                  aria-label={`Remove ${m.name}`}
                  onClick={() => removeFromCompare(m.id)}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => clearCompare()}
            className="rounded-full border border-[#d2d2d7] bg-white px-3.5 py-2 text-[12px] font-semibold text-[#1d1d1f]"
          >
            Clear
          </button>
          <button
            type="button"
            disabled={ids.length < 2}
            onClick={() => navigateTo(`/compare?ids=${ids.join(',')}`)}
            className="rounded-full bg-[#1d1d1f] px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-40"
          >
            View comparison
          </button>
        </div>
      </div>
    </div>
  )
}
