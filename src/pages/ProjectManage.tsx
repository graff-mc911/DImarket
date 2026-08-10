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
  updateMilestoneStatus,
  uploadProjectPhasePhoto,
  type MilestoneStatus,
  type ProjectDocument,
  type ProjectMediaItem,
  type ProjectMediaPhase,
  type ProjectMilestone,
} from '../lib/projectManager'
import {
  escrowPayoutLabel,
  escrowStatusLabel,
  fetchLatestEscrow,
  releaseProjectEscrow,
  startProjectEscrowCheckout,
  type ProjectEscrow,
} from '../lib/projectEscrow'
import { retryEscrowPayout } from '../lib/stripeConnect'
import { PROJECT_PAYMENTS_ENABLED } from '../lib/featureFlags'
import { navigateTo } from '../lib/navigation'
import { supabase } from '../lib/supabase'
import { formatEuro } from '../lib/costEstimator'
import { ReviewFormV2 } from '../components/reviews/ReviewFormV2'
import { hasReviewForListing } from '../lib/reviews/reviews'

/** AI Project Manager — /project/:id/manage */
export function ProjectManage({ listingId }: { listingId: string }) {
  const { user, t } = useApp()
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
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [reviewDone, setReviewDone] = useState(false)
  const [phase, setPhase] = useState<ProjectMediaPhase>('during')
  const [escrow, setEscrow] = useState<ProjectEscrow | null>(null)
  const [acceptedQuoteId, setAcceptedQuoteId] = useState<string | null>(null)
  const [quoteTotal, setQuoteTotal] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const reload = async () => {
    setLoading(true)
    setError(null)
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

    const latestEscrow = PROJECT_PAYMENTS_ENABLED
      ? await fetchLatestEscrow(listingId)
      : null
    setEscrow(latestEscrow)

    if (row?.hired_professional_id) {
      const { data: pro } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', row.hired_professional_id)
        .maybeSingle()
      setHiredName((pro as { full_name?: string } | null)?.full_name || 'Professional')
      const ms = await fetchMilestones(listingId)
      setMilestones(ms)
      setMedia(await fetchProjectMedia(listingId))
      setDocs(await fetchProjectDocuments(listingId))
      if (user?.id && row.pipeline_stage === 'completed') {
        setReviewDone(await hasReviewForListing(listingId, user.id))
      } else {
        setReviewDone(false)
      }

      const { data: quote } = await supabase
        .from('quotes')
        .select('id, total')
        .eq('listing_id', listingId)
        .eq('status', 'accepted')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      const q = quote as { id?: string; total?: number } | null
      setAcceptedQuoteId(q?.id ?? null)
      setQuoteTotal(typeof q?.total === 'number' ? q.total : null)
    } else {
      setHiredName(null)
      setMilestones([])
      setMedia([])
      setDocs([])
      setReviewDone(false)
      setAcceptedQuoteId(null)
      setQuoteTotal(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    void reload()
  }, [listingId, user?.id])

  const setStatus = async (id: string, status: MilestoneStatus) => {
    setBusy(true)
    setError(null)
    const ok = await updateMilestoneStatus(id, status)
    if (ok) {
      setMilestones(await fetchMilestones(listingId))
      setNotice(t('pipeline.milestoneUpdated' as never) || 'Milestone updated')
    } else {
      setError(
        t('pipeline.milestoneUpdateFailed' as never) ||
          'Could not update milestone (check permissions)',
      )
    }
    setBusy(false)
  }

  const onUpload = async (files: FileList | null) => {
    if (!files?.length || !user?.id) return
    setBusy(true)
    setError(null)
    for (const file of Array.from(files).slice(0, 6)) {
      const res = await uploadProjectPhasePhoto({
        listingId,
        userId: user.id,
        phase,
        file,
      })
      if (!res) {
        setError(t('pipeline.uploadFailed' as never) || 'Photo upload failed')
      }
    }
    setMedia(await fetchProjectMedia(listingId))
    setBusy(false)
  }

  const onHoldFunds = async () => {
    if (!user?.id || !hiredId || !acceptedQuoteId || !quoteTotal) {
      setError(
        t('pipeline.escrowMissingQuote' as never) ||
          'Accepted quote not found — cannot start hold.',
      )
      return
    }
    setBusy(true)
    setError(null)
    const res = await startProjectEscrowCheckout({
      listingId,
      customerId: user.id,
      professionalId: hiredId,
      quoteId: acceptedQuoteId,
      amountEur: quoteTotal,
      projectTitle: title,
    })
    setBusy(false)
    if ('error' in res) {
      setError(res.error)
      return
    }
    window.location.href = res.url
  }

  const onRetryPayout = async () => {
    setBusy(true)
    setError(null)
    const res = await retryEscrowPayout(listingId)
    setBusy(false)
    if ('error' in res) {
      setError(res.error)
      return
    }
    setNotice(
      t('pipeline.escrowPayoutRetried' as never) ||
        `Payout status: ${res.payout_status.replace(/_/g, ' ')}`,
    )
    await reload()
  }

  const onComplete = async () => {
    if (!user?.id) return
    if (PROJECT_PAYMENTS_ENABLED && escrow?.status === 'pending_checkout') {
      setError(
        t('pipeline.escrowHoldFirst' as never) ||
          'Hold the quote total on your card before completing the project.',
      )
      return
    }
    setBusy(true)
    setError(null)

    if (PROJECT_PAYMENTS_ENABLED && escrow?.status === 'authorized') {
      const released = await releaseProjectEscrow(listingId)
      if ('error' in released) {
        setBusy(false)
        setError(
          (t('pipeline.escrowReleaseFailed' as never) || 'Could not release escrow') +
            `: ${released.error}`,
        )
        return
      }
    }

    const r = await completeProject({ listingId, customerId: user.id })
    setBusy(false)
    if ('error' in r) {
      setError(r.error === 'not_owner' ? (t('pipeline.hireOwnerOnly' as never) || 'Only the owner can complete') : r.error)
      return
    }
    setNotice(
      PROJECT_PAYMENTS_ENABLED && escrow?.status === 'authorized'
        ? t('pipeline.completedEscrowNotice' as never) ||
            'Project completed — escrow released. Leave a review below.'
        : t('pipeline.completedNotice' as never) || 'Project completed — leave a review below.',
    )
    await reload()
  }

  const progress = projectProgress(milestones)
  const calendar = milestonesAsCalendar(milestones)
  const isOwner = Boolean(user?.id && authorId && user.id === authorId)
  const isHired = Boolean(user?.id && hiredId && user.id === hiredId)
  const hired = Boolean(hiredId)
  const completed = stage === 'completed'

  return (
    <div className="min-h-[70vh] bg-[#f5f5f7] pb-24">
      <div className="border-b border-[#e8e8ed] bg-white">
        <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
            {t('pipeline.manageTitle' as never) || 'AI Project Manager'}
          </p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-[#1d1d1f]">{title}</h1>
          <p className="mt-2 text-[15px] text-[#6e6e73]">
            {hiredName
              ? `${t('pipeline.hiredLabel' as never) || 'Hired'}: ${hiredName} · ${t('pipeline.stageLabel' as never) || 'Stage'}: ${stage.replace(/_/g, ' ')}`
              : t('pipeline.managePreHire' as never) ||
                'Hire a professional from ranked offers to start the project calendar here.'}
          </p>
          {isHired && !isOwner ? (
            <p className="mt-1 text-[13px] font-medium text-[#0066cc]">
              {t('pipeline.youAreHired' as never) || 'You are the hired professional on this project.'}
            </p>
          ) : null}
          {hired ? (
            <>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e8e8ed]">
                <div
                  className="h-full rounded-full bg-[#1d1d1f] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1.5 text-[12px] font-semibold text-[#86868b]">
                {progress}% {t('pipeline.completePct' as never) || 'complete'}
              </p>
            </>
          ) : null}
          {PROJECT_PAYMENTS_ENABLED && hired && escrow ? (
            <div className="mt-4 rounded-2xl border border-[#e8e8ed] bg-[#f5f5f7] px-4 py-3">
              <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
                {t('pipeline.escrowTitle' as never) || 'Project escrow'}
              </p>
              <p className="mt-1 text-[14px] font-semibold text-[#1d1d1f]">
                {escrowStatusLabel(escrow.status)}
                {escrow.amount > 0 ? ` · ${formatEuro(Number(escrow.amount))}` : ''}
              </p>
              {escrow.status === 'captured' && escrow.payout_status ? (
                <p className="mt-1 text-[13px] font-medium text-[#1d1d1f]">
                  {escrowPayoutLabel(escrow.payout_status)}
                  {escrow.transfer_amount != null
                    ? ` · ${formatEuro(Number(escrow.transfer_amount))}`
                    : ''}
                  {escrow.platform_fee_amount != null
                    ? ` (${t('pipeline.escrowFee' as never) || 'fee'} ${formatEuro(Number(escrow.platform_fee_amount))})`
                    : ''}
                </p>
              ) : null}
              <p className="mt-1 text-[12px] text-[#6e6e73]">
                {escrow.status === 'authorized'
                  ? t('pipeline.escrowHeldHint' as never) ||
                    'Card authorized. Funds capture when you complete the project.'
                  : escrow.status === 'pending_checkout'
                    ? t('pipeline.escrowPendingHint' as never) ||
                      'Authorize the quote total to hold funds securely until completion.'
                    : escrow.status === 'captured'
                      ? escrow.payout_status === 'skipped_no_connect'
                        ? t('pipeline.escrowPayoutSkippedHint' as never) ||
                          'Captured on platform — professional must finish Stripe Connect, then retry payout.'
                        : escrow.payout_status === 'transferred'
                          ? t('pipeline.escrowPayoutDoneHint' as never) ||
                            'Held funds captured and transferred to the professional.'
                          : t('pipeline.escrowCapturedHint' as never) ||
                            'Held funds were released after project completion.'
                      : null}
              </p>
              {isOwner && !completed && escrow.status === 'pending_checkout' ? (
                <button
                  type="button"
                  disabled={busy}
                  className="mt-3 rounded-full bg-[#1d1d1f] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-40"
                  onClick={() => void onHoldFunds()}
                >
                  {t('pipeline.escrowHoldCta' as never) || 'Hold funds on card'}
                </button>
              ) : null}
              {(isOwner || isHired) &&
              escrow.status === 'captured' &&
              (escrow.payout_status === 'skipped_no_connect' ||
                escrow.payout_status === 'failed') ? (
                <button
                  type="button"
                  disabled={busy}
                  className="mt-3 rounded-full bg-[#1d1d1f] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-40"
                  onClick={() => void onRetryPayout()}
                >
                  {t('pipeline.escrowRetryPayout' as never) || 'Retry professional payout'}
                </button>
              ) : null}
            </div>
          ) : null}
          {PROJECT_PAYMENTS_ENABLED &&
          hired &&
          isOwner &&
          !completed &&
          !escrow &&
          acceptedQuoteId &&
          quoteTotal ? (
            <div className="mt-4 rounded-2xl border border-[#e8e8ed] bg-[#f5f5f7] px-4 py-3">
              <p className="text-[14px] font-semibold text-[#1d1d1f]">
                {t('pipeline.escrowTitle' as never) || 'Project escrow'}
              </p>
              <p className="mt-1 text-[12px] text-[#6e6e73]">
                {t('pipeline.escrowPendingHint' as never) ||
                  'Authorize the quote total to hold funds securely until completion.'}{' '}
                ({formatEuro(quoteTotal)})
              </p>
              <button
                type="button"
                disabled={busy}
                className="mt-3 rounded-full bg-[#1d1d1f] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-40"
                onClick={() => void onHoldFunds()}
              >
                {t('pipeline.escrowHoldCta' as never) || 'Hold funds on card'}
              </button>
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <NavChip onClick={() => navigateTo(`/project/${listingId}/offers`)}>
              {t('pipeline.offersTitle' as never) || 'Offers'}
            </NavChip>
            <NavChip onClick={() => navigateTo(`/project/${listingId}/matches`)}>
              {t('pipeline.backToMatches' as never) || 'Matches'}
            </NavChip>
            <NavChip onClick={() => navigateTo(`/listing/${listingId}`)}>
              {t('project.matches.viewProject' as never) || 'Listing'}
            </NavChip>
            {hiredId && completed ? (
              <NavChip
                onClick={() =>
                  navigateTo(`/professional/${hiredId}?listing=${listingId}&review=1`)
                }
              >
                <Star className="h-3.5 w-3.5" />
                {t('pipeline.reviewPro' as never) || 'Review pro'}
              </NavChip>
            ) : null}
            {isOwner && hired && !completed ? (
              <button
                type="button"
                disabled={busy}
                className="rounded-full bg-[#1d1d1f] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-40"
                onClick={() => void onComplete()}
              >
                {t('pipeline.completeProject' as never) || 'Complete project'}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 md:px-6">
        {error ? (
          <p className="rounded-2xl bg-[#fef2f2] px-4 py-3 text-[13px] text-[#b91c1c]">{error}</p>
        ) : null}
        {notice ? (
          <p className="rounded-2xl bg-[#ecfdf5] px-4 py-3 text-[13px] font-medium text-[#047857]">
            {notice}
          </p>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[#86868b]" />
          </div>
        ) : !hired ? (
          <div className="rounded-[20px] border border-[#e8e8ed] bg-white px-6 py-14 text-center">
            <p className="text-[15px] text-[#86868b]">
              {t('pipeline.manageEmpty' as never) ||
                'No professional hired yet. Compare ranked offers and hire to unlock milestones, photos and documents.'}
            </p>
            <button
              type="button"
              className="mt-5 rounded-full bg-[#1d1d1f] px-5 py-2.5 text-[13px] font-semibold text-white"
              onClick={() => navigateTo(`/project/${listingId}/offers`)}
            >
              {t('pipeline.offersTitle' as never) || 'Ranked offers'}
            </button>
          </div>
        ) : (
          <>
            {completed && isOwner && hiredId && !reviewDone ? (
              <section className="rounded-[20px] border border-[#e8e8ed] bg-white p-5">
                <h2 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
                  <Star className="h-3.5 w-3.5" />
                  {t('pipeline.leaveReview' as never) || 'Leave a review'}
                </h2>
                <p className="mb-4 text-[13px] text-[#6e6e73]">
                  {t('pipeline.leaveReviewSub' as never) ||
                    `How was the work with ${hiredName || 'the professional'}?`}
                </p>
                <ReviewFormV2
                  professionalId={hiredId}
                  listingId={listingId}
                  onSuccess={() => {
                    setReviewDone(true)
                    setNotice(t('pipeline.reviewThanks' as never) || 'Thanks — review saved.')
                  }}
                />
              </section>
            ) : null}
            {completed && reviewDone ? (
              <p className="rounded-2xl bg-[#ecfdf5] px-4 py-3 text-[13px] font-medium text-[#047857]">
                {t('pipeline.reviewThanks' as never) || 'Thanks — review saved.'}
              </p>
            ) : null}

            {/* Work calendar */}
            <section className="rounded-[20px] border border-[#e8e8ed] bg-white p-5">
              <h2 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
                <CalendarDays className="h-3.5 w-3.5" />
                {t('pipeline.workCalendar' as never) || 'Work calendar'}
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
                  <p className="text-[13px] text-[#86868b]">
                    {t('pipeline.noDueDates' as never) || 'No due dates yet.'}
                  </p>
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
                    {(isOwner || isHired) && !completed ? (
                      <div className="flex flex-wrap gap-1.5">
                        <StatusBtn
                          active={m.status === 'in_progress'}
                          label={t('pipeline.statusInProgress' as never) || 'In progress'}
                          icon={<Circle className="h-3 w-3" />}
                          onClick={() => void setStatus(m.id, 'in_progress')}
                        />
                        <StatusBtn
                          active={m.status === 'blocked'}
                          label={t('pipeline.statusBlocked' as never) || 'Blocked'}
                          icon={<Pause className="h-3 w-3" />}
                          onClick={() => void setStatus(m.id, 'blocked')}
                        />
                        <StatusBtn
                          active={m.status === 'done'}
                          label={t('pipeline.statusDone' as never) || 'Done'}
                          icon={<Check className="h-3 w-3" />}
                          onClick={() => void setStatus(m.id, 'done')}
                        />
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
              {!milestones.length ? (
                <p className="rounded-[20px] border border-[#e8e8ed] bg-white px-5 py-8 text-center text-[13px] text-[#86868b]">
                  {t('pipeline.noMilestones' as never) ||
                    'Milestones will appear after hire from the cost estimate work stages.'}
                </p>
              ) : null}
            </ol>

            {/* Phase photos */}
            <section className="rounded-[20px] border border-[#e8e8ed] bg-white p-5">
              <h2 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
                <Camera className="h-3.5 w-3.5" />
                {t('pipeline.phasePhotos' as never) || 'Before / during / after'}
              </h2>
              {(isOwner || isHired) && !completed ? (
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
                    {t('pipeline.uploadPhoto' as never) || 'Upload photo'}
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
                    {t('pipeline.noPhotos' as never) ||
                      'No photos yet — document the site before, during and after works.'}
                  </p>
                ) : null}
              </div>
            </section>

            {/* Documents & payments */}
            <section className="rounded-[20px] border border-[#e8e8ed] bg-white p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
                  <FileText className="h-3.5 w-3.5" />
                  {t('pipeline.documents' as never) || 'Acts · invoices · warranty · payments'}
                </h2>
                {isOwner || isHired ? (
                  <button
                    type="button"
                    className="rounded-full border border-[#d2d2d7] px-3 py-1.5 text-[12px] font-semibold"
                    disabled={busy || !user}
                    onClick={() => {
                      if (!user?.id) return
                      setBusy(true)
                      void issueProjectDocuments({ listingId, userId: user.id })
                        .then(() => fetchProjectDocuments(listingId).then(setDocs))
                        .finally(() => setBusy(false))
                    }}
                  >
                    {t('pipeline.generateDocs' as never) || 'Generate documents'}
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
                      {t('pipeline.printPdf' as never) || 'Print / PDF'}
                    </button>
                  </li>
                ))}
                {!docs.length ? (
                  <p className="text-[13px] text-[#86868b]">
                    {t('pipeline.noDocs' as never) ||
                      'Generate acceptance act, invoice, warranty and payment checklist when ready.'}
                  </p>
                ) : null}
              </ul>
            </section>
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
