/**
 * AI Dispatcher — package listing + estimate context for matched professionals.
 * Extends notifyJobMatchProfessionals / match-notify-channels (no parallel dispatch).
 */
import { supabase } from './supabase'
import { notifyJobMatchProfessionals } from './matching/notifyMatches'
import { createNotification } from './notifications/notifications'
import { formatEuro } from './costEstimator'

export type DispatchPackage = {
  listingId: string
  title: string
  description: string
  city?: string | null
  addressLabel?: string | null
  budgetMin?: number | null
  budgetMax?: number | null
  deadlineAt?: string | null
  photoUrls: string[]
  estimateSummary?: string | null
  estimateStandard?: number | null
}

export async function buildDispatchPackage(listingId: string): Promise<DispatchPackage | null> {
  const { data: listing, error } = await supabase
    .from('listings')
    .select(
      'id, title, description, city_name, location, budget_min, budget_max, deadline_at, price',
    )
    .eq('id', listingId)
    .maybeSingle()

  if (error || !listing) return null

  const { data: files } = await supabase
    .from('project_files')
    .select('url, kind, mime_type')
    .eq('listing_id', listingId)
    .limit(8)

  const photoUrls = ((files as Array<{ url: string; kind?: string; mime_type?: string }> | null) ?? [])
    .filter((f) => f.kind === 'photo' || f.mime_type?.startsWith('image/'))
    .map((f) => f.url)

  let estimateSummary: string | null = null
  let estimateStandard: number | null = null
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: est } = await (supabase as any)
      .from('cost_estimates')
      .select('total_standard, title, estimate_json')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (est) {
      estimateStandard = Number(est.total_standard) || null
      const days =
        (est.estimate_json as { totalDaysMin?: number; totalDaysMax?: number } | null)
          ?.totalDaysMin != null
          ? `${(est.estimate_json as { totalDaysMin: number; totalDaysMax: number }).totalDaysMin}–${(est.estimate_json as { totalDaysMin: number; totalDaysMax: number }).totalDaysMax} days`
          : null
      estimateSummary = [
        est.title,
        estimateStandard != null ? `Reference budget (std): ${formatEuro(estimateStandard)}` : null,
        days ? `Timeline: ${days}` : null,
      ]
        .filter(Boolean)
        .join(' · ')
    }
  } catch {
    /* table may be missing */
  }

  const row = listing as {
    id: string
    title: string
    description: string
    city_name?: string | null
    location?: string | null
    budget_min?: number | null
    budget_max?: number | null
    deadline_at?: string | null
  }

  return {
    listingId: row.id,
    title: row.title,
    description: row.description,
    city: row.city_name,
    addressLabel: row.location,
    budgetMin: row.budget_min,
    budgetMax: row.budget_max,
    deadlineAt: row.deadline_at,
    photoUrls,
    estimateSummary,
    estimateStandard,
  }
}

export function formatDispatchMessage(pkg: DispatchPackage): string {
  const lines = [
    `New project match: ${pkg.title}`,
    pkg.addressLabel || pkg.city ? `Location: ${pkg.addressLabel || pkg.city}` : null,
    pkg.budgetMin != null || pkg.budgetMax != null
      ? `Budget: ${pkg.budgetMin ?? '—'} – ${pkg.budgetMax ?? '—'} EUR`
      : null,
    pkg.deadlineAt ? `Deadline: ${new Date(pkg.deadlineAt).toLocaleDateString()}` : null,
    pkg.estimateSummary ? `Estimate: ${pkg.estimateSummary}` : null,
    pkg.photoUrls.length ? `Photos: ${pkg.photoUrls.length}` : null,
    '',
    pkg.description.slice(0, 500),
    '',
    'Respond: Ready · Need inspection · Decline',
  ]
  return lines.filter((l) => l != null).join('\n')
}

/**
 * Dispatch to matched professionals (in-app notify + channel edge function).
 */
export async function dispatchToProfessionals(
  listingId: string,
  profileIds: string[],
): Promise<{ notified: number }> {
  if (!profileIds.length) return { notified: 0 }

  const pkg = await buildDispatchPackage(listingId)
  const body = pkg ? formatDispatchMessage(pkg) : `New matched project: ${listingId}`

  const notified = await notifyJobMatchProfessionals(listingId, profileIds)

  // Enrich individual notifications when RPC only creates stubs
  for (const pid of profileIds.slice(0, 25)) {
    try {
      await createNotification({
        userId: pid,
        type: 'match',
        title: pkg?.title || 'New project match',
        body,
        linkPath: '/leads',
        referenceType: 'listing',
        referenceId: listingId,
      })
    } catch {
      /* ignore per-user failures */
    }
  }

  try {
    await supabase.functions.invoke('match-notify-channels', {
      body: {
        listing_id: listingId,
        profile_ids: profileIds,
        package: pkg
          ? {
              title: pkg.title,
              description: pkg.description.slice(0, 800),
              address: pkg.addressLabel,
              budget_min: pkg.budgetMin,
              budget_max: pkg.budgetMax,
              deadline_at: pkg.deadlineAt,
              estimate_summary: pkg.estimateSummary,
              photo_urls: pkg.photoUrls.slice(0, 5),
            }
          : null,
      },
    })
  } catch (err) {
    console.warn('dispatch channels:', err)
  }

  return { notified: Math.max(notified, profileIds.length) }
}
