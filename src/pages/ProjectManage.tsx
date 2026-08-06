import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  CalendarDays,
  Camera,
  Check,
  Circle,
  FileText,
  Loader2,
  Pause,
  Star,
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import {
  completeProject,
  fetchMilestones,
  fetchProjectDocuments,
  fetchProjectMedia,
  issueProjectDocuments,
  milestonesAsCalendar,
  openDocumentPrint,
  projectProgress,
  seedMilestonesFromStages,
  updateMilestoneStatus,
  uploadProjectPhasePhoto,
  type MilestoneStatus,
  type ProjectDocument,
  type ProjectMediaItem,
  type ProjectMediaPhase,
  type ProjectMilestone,
} from '../lib/projectManager'
import { navigateTo } from '../lib/navigation'
import { supabase } from '../lib/supabase'
import { formatEuro } from '../lib/costEstimator'

/** AI Project Manager — /project/:id/manage */
export function ProjectManage({ listingId }: { listingId: string }) {
  const { user } = useApp()
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([])
  const [media, setMedia] = useState<ProjectMediaItem[]>([])
  const [docs, setDocs] = useState<ProjectDocument[]>([])
  const [title, setTitle] = useState('Project')
  const [loading, setLoading] = useState(true)
  const [hiredName, setHiredName] = useState<string | null>(null)
  const [hiredId, setHiredId] = useState<string | null>(null)
  const [authorId, setAuthorId] = useState<string | null>(null)
  const [stage, setStage] = useState<string>('intake')
  const [busy, setBusy] = useState(false)
  const [phase, setPhase] = useState<ProjectMediaPhase>('during')
  const fileRef = useRef<HTMLInputElement>(null)

  const reload = async () => {
    setLoading(true)
    const { data: listing } = await supabase
      .from('listings')
      .select('title, hired_professional_id, author_id, description, pipeline_stage')
      .eq('id', listingId)
      .maybeSingle()

    const row = listing as {
      title?: string
      hired_professional_id?: string | null
      author_id?: string
      pipeline_stage?: string | null
    } | null
    if (row?.title) setTitle(row.title)
    setAuthorId(row?.author_id ?? null)
    setStage(row?.pipeline_stage || 'intake')
    setHiredId(row?.hired_professional_id ?? null)

    if (row?.hired_professional_id) {
      const { data: pro } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', row.hired_professional_id)
        .maybeSingle()
      setHiredName((pro as { full_name?: string } | null)?.full_name || 'Professional')
    }

    let ms = await fetchMilestones(listingId)
    if (!ms.length) ms = await seedMilestonesFromStages(listingId, [])
    setMilestones(ms)
    setMedia(await fetchProjectMedia(listingId))
    setDocs(await fetchProjectDocuments(listingId))
    setLoading(false)
  }

  useEffect(() => {
    void reload()
  }, [listingId])

  const setStatus = async (id: string, status: MilestoneStatus) => {
    setBusy(true)
    const ok = await updateMilestoneStatus(id, status)
    if (ok) setMilestones(await fetchMilestones(listingId))
    setBusy(false)
  }

  const onUpload = async (files: FileList | null) => {
    if (!files?.length || !user?.id) return
    setBusy(true)
    for (const file of Array.from(files).slice(0, 6)) {
      await uploadProjectPhasePhoto({
        listingId,
        userId: user.id,
        phase,
        file,
      })
    }
    setMedia(await fetchProjectMedia(listingId))
    setBusy(false)
  }

  const progress = projectProgress(milestones)
  const calendar = milestonesAsCalendar(milestones)
  const isOwner = Boolean(user?.id && authorId && user.id === authorId)
  const isHired = Boolean(user?.id && hiredId && user.id === hiredId)

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
              ? `Hired: ${hiredName} · Stage: ${stage.replace(/_/g, ' ')}`
              : 'Select an offer to assign a professional, then track the full project here.'}
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e8e8ed]">
            <div
              className="h-full rounded-full bg-[#1d1d1f] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1.5 text-[12px] font-semibold text-[#86868b]">{progress}% complete</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <NavChip onClick={() => navigateTo(`/project/${listingId}/offers`)}>Offers</NavChip>
            <NavChip onClick={() => navigateTo(`/project/${listingId}/matches`)}>Matches</NavChip>
            <NavChip onClick={() => navigateTo(`/listing/${listingId}`)}>Listing</NavChip>
            {hiredId ? (
              <NavChip onClick={() => navigateTo(`/professional/${hiredId}`)}>
                <Star className="h-3.5 w-3.5" /> Review pro
              </NavChip>
            ) : null}
            {isOwner && stage !== 'completed' ? (
              <button
                type="button"
                disabled={busy}
                className="rounded-full bg-[#1d1d1f] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-40"
                onClick={() => {
                  if (!user?.id) return
                  void completeProject({ listingId, customerId: user.id }).then((r) => {
                    if ('ok' in r) void reload()
                  })
                }}
              >
                Complete project
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 md:px-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[#86868b]" />
          </div>
        ) : (
          <>
            {/* Work calendar */}
            <section className="rounded-[20px] border border-[#e8e8ed] bg-white p-5">
              <h2 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
                <CalendarDays className="h-3.5 w-3.5" /> Work calendar
              </h2>
              <ul className="space-y-2">
                {calendar.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#f5f5f7] px-4 py-3"
                  >
                    <div>
                      <p className="text-[14px] font-semibold text-[#1d1d1f]">{c.title}</p>
                      <p className="text-[12px] capitalize text-[#86868b]">
                        Due {new Date(c.dueAt).toLocaleDateString()} · {c.status.replace(/_/g, ' ')}
                        {c.laborHours != null ? ` · ~${c.laborHours} h` : ''}
                      </p>
                    </div>
                  </li>
                ))}
                {!calendar.length ? (
                  <p className="text-[13px] text-[#86868b]">No due dates yet — milestones will appear after hire.</p>
                ) : null}
              </ul>
            </section>

            {/* Milestones */}
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
                          {m.due_at ? ` · due ${new Date(m.due_at).toLocaleDateString()}` : ''}
                          {m.labor_hours != null ? ` · ~${m.labor_hours} h` : ''}
                        </p>
                      </div>
                    </div>
                    {(isOwner || isHired) && stage !== 'completed' ? (
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
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>

            {/* Phase photos */}
            <section className="rounded-[20px] border border-[#e8e8ed] bg-white p-5">
              <h2 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
                <Camera className="h-3.5 w-3.5" /> Before / during / after
              </h2>
              {(isOwner || isHired) && stage !== 'completed' ? (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {(['before', 'during', 'after'] as ProjectMediaPhase[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPhase(p)}
                      className={`rounded-full px-3 py-1.5 text-[12px] font-semibold capitalize ${
                        phase === p
                          ? 'bg-[#1d1d1f] text-white'
                          : 'bg-[#f5f5f7] text-[#1d1d1f]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="rounded-full border border-[#d2d2d7] px-3 py-1.5 text-[12px] font-semibold"
                    onClick={() => fileRef.current?.click()}
                    disabled={busy || !user}
                  >
                    Upload photo
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      void onUpload(e.target.files)
                      e.target.value = ''
                    }}
                  />
                </div>
              ) : null}
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {media.map((m) => (
                  <a
                    key={m.id}
                    href={m.url}
                    target="_blank"
                    rel="noreferrer"
                    className="relative aspect-square overflow-hidden rounded-xl bg-[#f5f5f7]"
                  >
                    <img src={m.url} alt="" className="h-full w-full object-cover" />
                    <span className="absolute bottom-1 left-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                      {m.phase}
                    </span>
                  </a>
                ))}
                {!media.length ? (
                  <p className="col-span-full text-[13px] text-[#86868b]">
                    No photos yet — document the site before, during and after works.
                  </p>
                ) : null}
              </div>
            </section>

            {/* Documents & payments */}
            <section className="rounded-[20px] border border-[#e8e8ed] bg-white p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
                  <FileText className="h-3.5 w-3.5" /> Acts · invoices · warranty · payments
                </h2>
                {(isOwner || isHired) ? (
                  <button
                    type="button"
                    className="rounded-full border border-[#d2d2d7] px-3 py-1.5 text-[12px] font-semibold"
                    disabled={busy || !user}
                    onClick={() => {
                      if (!user?.id) return
                      void issueProjectDocuments({ listingId, userId: user.id }).then((d) =>
                        setDocs(d.length ? d : docs),
                      ).then(() => fetchProjectDocuments(listingId).then(setDocs))
                    }}
                  >
                    Generate documents
                  </button>
                ) : null}
              </div>
              <ul className="space-y-2">
                {docs.map((d) => (
                  <li
                    key={d.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#f5f5f7] px-4 py-3"
                  >
                    <div>
                      <p className="text-[14px] font-semibold text-[#1d1d1f]">{d.title}</p>
                      <p className="text-[12px] capitalize text-[#86868b]">
                        {d.doc_type.replace(/_/g, ' ')} · {d.status}
                        {d.amount != null ? ` · ${formatEuro(Number(d.amount))}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold ring-1 ring-[#e8e8ed]"
                      onClick={() => openDocumentPrint(d)}
                    >
                      Print / PDF
                    </button>
                  </li>
                ))}
                {!docs.length ? (
                  <p className="text-[13px] text-[#86868b]">
                    Generate acceptance act, invoice, warranty and payment checklist when ready.
                  </p>
                ) : null}
              </ul>
            </section>

            <div className="rounded-[20px] border border-dashed border-[#d2d2d7] bg-white/70 px-5 py-4 text-[13px] text-[#6e6e73]">
              AI Project Manager keeps the calendar, reminders, progress alerts, phase photos,
              payment checklist and closing documents in one place — coordinated automatically after
              hire.
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function NavChip({
  children,
  onClick,
}: {
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] bg-white px-4 py-2 text-[13px] font-semibold"
      onClick={onClick}
    >
      {children}
    </button>
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
