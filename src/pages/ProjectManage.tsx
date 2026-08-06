import { useEffect, useState, type ReactNode } from 'react'
import { Check, Circle, Loader2, Pause } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import {
  fetchMilestones,
  projectProgress,
  seedMilestonesFromStages,
  updateMilestoneStatus,
  type MilestoneStatus,
  type ProjectMilestone,
} from '../lib/projectManager'
import { navigateTo } from '../lib/navigation'
import { supabase } from '../lib/supabase'

/** AI Project Manager — /project/:id/manage */
export function ProjectManage({ listingId }: { listingId: string }) {
  const { user } = useApp()
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([])
  const [title, setTitle] = useState('Project')
  const [loading, setLoading] = useState(true)
  const [hiredName, setHiredName] = useState<string | null>(null)

  const reload = async () => {
    setLoading(true)
    const { data: listing } = await supabase
      .from('listings')
      .select('title, hired_professional_id, author_id, description')
      .eq('id', listingId)
      .maybeSingle()

    const row = listing as {
      title?: string
      hired_professional_id?: string | null
      author_id?: string
    } | null
    if (row?.title) setTitle(row.title)

    if (row?.hired_professional_id) {
      const { data: pro } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', row.hired_professional_id)
        .maybeSingle()
      setHiredName((pro as { full_name?: string } | null)?.full_name || 'Professional')
    }

    let ms = await fetchMilestones(listingId)
    if (!ms.length) {
      ms = await seedMilestonesFromStages(listingId, [])
    }
    setMilestones(ms)
    setLoading(false)
  }

  useEffect(() => {
    void reload()
  }, [listingId])

  const setStatus = async (id: string, status: MilestoneStatus) => {
    const ok = await updateMilestoneStatus(id, status)
    if (ok) setMilestones(await fetchMilestones(listingId))
  }

  const progress = projectProgress(milestones)

  return (
    <div className="min-h-[70vh] bg-[#f5f5f7] pb-24">
      <div className="border-b border-[#e8e8ed] bg-white">
        <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
            AI Project Manager
          </p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-[#1d1d1f]">{title}</h1>
          <p className="mt-2 text-[15px] text-[#6e6e73]">
            {hiredName
              ? `Hired: ${hiredName}`
              : 'Select an offer to assign a professional, then track milestones here.'}
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e8e8ed]">
            <div
              className="h-full rounded-full bg-[#1d1d1f] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1.5 text-[12px] font-semibold text-[#86868b]">{progress}% complete</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full border border-[#d2d2d7] bg-white px-4 py-2 text-[13px] font-semibold"
              onClick={() => navigateTo(`/project/${listingId}/offers`)}
            >
              Offers
            </button>
            <button
              type="button"
              className="rounded-full border border-[#d2d2d7] bg-white px-4 py-2 text-[13px] font-semibold"
              onClick={() => navigateTo(`/project/${listingId}/matches`)}
            >
              Matches
            </button>
            <button
              type="button"
              className="rounded-full border border-[#d2d2d7] bg-white px-4 py-2 text-[13px] font-semibold"
              onClick={() => navigateTo(`/listing/${listingId}`)}
            >
              Listing
            </button>
            {!user ? (
              <button
                type="button"
                className="rounded-full bg-[#1d1d1f] px-4 py-2 text-[13px] font-semibold text-white"
                onClick={() => navigateTo('/login')}
              >
                Sign in
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[#86868b]" />
          </div>
        ) : (
          <ol className="space-y-3">
            {milestones.map((m, i) => (
              <li
                key={m.id}
                className="rounded-[20px] border border-[#e8e8ed] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f5f5f7] text-[13px] font-bold text-[#1d1d1f]">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-[16px] font-semibold text-[#1d1d1f]">{m.label}</p>
                      <p className="mt-0.5 text-[12px] capitalize text-[#86868b]">
                        {m.status.replace(/_/g, ' ')}
                        {m.labor_hours != null ? ` · ~${m.labor_hours} h` : ''}
                        {m.trade_id ? ` · ${m.trade_id}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <StatusBtn
                      active={m.status === 'in_progress'}
                      label="In progress"
                      icon={<Circle className="h-3 w-3" />}
                      onClick={() => void setStatus(m.id, 'in_progress')}
                    />
                    <StatusBtn
                      active={m.status === 'blocked'}
                      label="Blocked"
                      icon={<Pause className="h-3 w-3" />}
                      onClick={() => void setStatus(m.id, 'blocked')}
                    />
                    <StatusBtn
                      active={m.status === 'done'}
                      label="Done"
                      icon={<Check className="h-3 w-3" />}
                      onClick={() => void setStatus(m.id, 'done')}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}

        <div className="mt-6 rounded-[20px] border border-dashed border-[#d2d2d7] bg-white/70 px-5 py-4 text-[13px] text-[#6e6e73]">
          AI Project Manager tracks work stages seeded from your cost-estimate WBS (or default
          Preparation → Construction → Finishing → Inspection). Chat and notifications stay the
          communication channel for day-to-day updates.
        </div>
      </div>
    </div>
  )
}

function StatusBtn({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean
  label: string
  icon: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold ${
        active
          ? 'bg-[#1d1d1f] text-white'
          : 'border border-[#e8e8ed] bg-[#fafafa] text-[#1d1d1f] hover:bg-[#f5f5f7]'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
