import { supabase } from '../supabase'
import { createNotification } from '../notifications/notifications'

export type VerificationStatus =
  | 'unverified'
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'needs_info'

export type ReviewAction = 'approve' | 'reject' | 'request_info'

export type ContractorVerification = {
  id: string
  profile_id: string
  status: VerificationStatus
  business_name: string | null
  vat_number: string | null
  trade_license_ref?: string | null
  insurance_ref?: string | null
  address_line?: string | null
  address_city?: string | null
  address_country?: string | null
  address_postal_code?: string | null
  trust_score: number | null
  submitted_at: string | null
  reviewed_at?: string | null
  review_notes: string | null
}

export type VerificationDocument = {
  id: string
  verification_id: string
  doc_type: string
  storage_path: string
  public_url: string
  file_name: string | null
  mime_type: string | null
  created_at: string
  signed_url?: string | null
}

export type VerificationReview = {
  id: string
  verification_id: string
  reviewer_id: string
  action: ReviewAction
  notes: string | null
  created_at: string
}

export type PendingVerificationRow = ContractorVerification & {
  profile?: {
    full_name: string | null
    email: string | null
    location: string | null
    phone?: string | null
    verification_level?: string | null
    is_verified?: boolean | null
    is_premium?: boolean | null
    identity_verified?: boolean | null
    business_verified?: boolean | null
    address_verified?: boolean | null
  } | null
}

const BUCKET = 'verification-docs'

export const VERIFICATION_DOC_TYPES = [
  { key: 'identity', label: 'Identity document', required: true },
  { key: 'proof_of_address', label: 'Proof of address', required: true },
  { key: 'business_registration', label: 'Business registration', required: true },
  { key: 'vat', label: 'VAT / tax certificate', required: false },
  { key: 'trade_license', label: 'Professional / trade license', required: true },
  { key: 'professional_license', label: 'Professional license (alt)', required: false },
  { key: 'insurance', label: 'Liability insurance', required: false },
  { key: 'background_check', label: 'Background check', required: false },
  { key: 'certification', label: 'Certification (optional)', required: false },
] as const

export async function getOrCreateVerification(
  profileId: string,
): Promise<ContractorVerification | null> {
  const { data: existing } = await supabase
    .from('contractor_verifications')
    .select('*')
    .eq('profile_id', profileId)
    .maybeSingle()

  if (existing) return existing as ContractorVerification

  const { data, error } = await supabase
    .from('contractor_verifications')
    .insert({ profile_id: profileId, status: 'unverified' })
    .select()
    .single()

  if (error) {
    console.error('getOrCreateVerification:', error)
    return null
  }
  return data as ContractorVerification
}

export async function submitVerificationRequest(
  verificationId: string,
  fields: {
    business_name?: string
    vat_number?: string
    trade_license_ref?: string
    insurance_ref?: string
    address_line?: string
    address_city?: string
    address_country?: string
    address_postal_code?: string
  },
): Promise<boolean> {
  const { error } = await supabase
    .from('contractor_verifications')
    .update({
      ...fields,
      status: 'pending',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', verificationId)

  return !error
}

export async function uploadVerificationDoc(
  profileId: string,
  verificationId: string,
  file: File,
  docType: string,
): Promise<boolean> {
  const safeName = file.name.replace(/[^\w.\-]+/g, '_').slice(0, 80)
  const path = `${profileId}/${verificationId}/${docType}-${Date.now()}-${safeName}`
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  })
  if (upErr) {
    console.error('uploadVerificationDoc:', upErr)
    return false
  }

  const { data: signed } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 7)
  const publicUrl = signed?.signedUrl ?? path

  const { error } = await supabase.from('verification_documents').insert({
    verification_id: verificationId,
    doc_type: docType,
    storage_path: path,
    public_url: publicUrl,
    file_name: file.name,
    mime_type: file.type,
  })
  return !error
}

export async function listVerificationDocuments(
  verificationId: string,
): Promise<VerificationDocument[]> {
  const { data, error } = await supabase
    .from('verification_documents')
    .select('*')
    .eq('verification_id', verificationId)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  const docs = data as VerificationDocument[]
  const withUrls = await Promise.all(
    docs.map(async (doc) => {
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(doc.storage_path, 60 * 60)
      return { ...doc, signed_url: signed?.signedUrl ?? doc.public_url }
    }),
  )
  return withUrls
}

export async function listVerificationDocTypes(verificationId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('verification_documents')
    .select('doc_type')
    .eq('verification_id', verificationId)

  if (error || !data) return []
  return [...new Set((data as { doc_type: string }[]).map((d) => d.doc_type))]
}

export async function listVerificationHistory(
  verificationId: string,
): Promise<VerificationReview[]> {
  const { data, error } = await supabase
    .from('verification_reviews')
    .select('*')
    .eq('verification_id', verificationId)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data as VerificationReview[]
}

export async function adminReviewVerification(
  verificationId: string,
  reviewerId: string,
  action: ReviewAction,
  notes?: string,
): Promise<boolean> {
  // Prefer secure RPC when migration is applied
  const { data: rpcOk, error: rpcErr } = await supabase.rpc('admin_review_verification' as never, {
    p_verification_id: verificationId,
    p_action: action,
    p_notes: notes ?? null,
  } as never)

  if (!rpcErr && rpcOk) {
    await notifyReviewResult(verificationId, action, notes)
    return true
  }

  // Fallback client path (pre-migration)
  const status: VerificationStatus =
    action === 'approve' ? 'verified' : action === 'reject' ? 'rejected' : 'needs_info'
  const trust = action === 'approve' ? 85 : action === 'reject' ? 20 : 40

  const { data: ver } = await supabase
    .from('contractor_verifications')
    .select('profile_id')
    .eq('id', verificationId)
    .single()

  const { error } = await supabase
    .from('contractor_verifications')
    .update({
      status,
      reviewer_id: reviewerId,
      review_notes: notes ?? null,
      reviewed_at: new Date().toISOString(),
      trust_score: trust,
      updated_at: new Date().toISOString(),
    })
    .eq('id', verificationId)

  if (error) return false

  await supabase.from('verification_reviews').insert({
    verification_id: verificationId,
    reviewer_id: reviewerId,
    action,
    notes: notes ?? null,
  })

  if (ver?.profile_id && action === 'approve') {
    const docs = await listVerificationDocTypes(verificationId)
    await supabase
      .from('profiles')
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
        identity_verified: docs.includes('identity'),
        business_verified:
          docs.includes('business_registration') || docs.includes('vat'),
        address_verified: docs.includes('proof_of_address'),
      } as never)
      .eq('id', ver.profile_id)
  }

  await notifyReviewResult(verificationId, action, notes)
  return true
}

async function notifyReviewResult(
  verificationId: string,
  action: ReviewAction,
  notes?: string,
): Promise<void> {
  const { data: ver } = await supabase
    .from('contractor_verifications')
    .select('profile_id')
    .eq('id', verificationId)
    .maybeSingle()

  const profileId = (ver as { profile_id?: string } | null)?.profile_id
  if (!profileId) return

  if (action === 'approve') {
    await createNotification({
      userId: profileId,
      type: 'verification',
      title: 'Verification approved',
      body: 'Your verification was approved. Trust badges are now active on your profile.',
      linkPath: '/verification',
    })
  } else if (action === 'request_info') {
    await createNotification({
      userId: profileId,
      type: 'verification',
      title: 'Additional documents requested',
      body: notes || 'Please upload the requested documents and resubmit.',
      linkPath: '/verification',
    })
  } else {
    await createNotification({
      userId: profileId,
      type: 'verification',
      title: 'Verification rejected',
      body: notes || 'Your verification was rejected. Review notes and try again.',
      linkPath: '/verification',
    })
  }
}

/** Email: only if Supabase Auth already confirmed the address. Phone: requires profile phone. */
export async function markContactVerified(
  profileId: string,
  kind: 'email' | 'phone',
  opts?: { emailConfirmed?: boolean; phone?: string | null },
): Promise<{ ok: boolean; error?: string }> {
  if (kind === 'email') {
    if (!opts?.emailConfirmed) {
      return { ok: false, error: 'Confirm your email via the link sent by DImarket first.' }
    }
    const { error } = await supabase
      .from('profiles')
      .update({ email_verified_at: new Date().toISOString() } as never)
      .eq('id', profileId)
    return error ? { ok: false, error: error.message } : { ok: true }
  }

  if (!opts?.phone || opts.phone.trim().length < 6) {
    return { ok: false, error: 'Add a valid phone number in Settings first.' }
  }
  const { error } = await supabase
    .from('profiles')
    .update({ phone_verified_at: new Date().toISOString() } as never)
    .eq('id', profileId)
  return error ? { ok: false, error: error.message } : { ok: true }
}

export async function listPendingVerifications(): Promise<PendingVerificationRow[]> {
  const { data, error } = await supabase
    .from('contractor_verifications')
    .select(
      '*, profile:profiles(full_name, email, location, phone, verification_level, is_verified, is_premium, identity_verified, business_verified, address_verified)',
    )
    .in('status', ['pending', 'needs_info'])
    .order('submitted_at', { ascending: true })

  if (error) {
    // Fallback if badge columns missing
    const retry = await supabase
      .from('contractor_verifications')
      .select('*, profile:profiles(full_name, email, location, phone, verification_level, is_verified, is_premium)')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: true })
    return (retry.data ?? []) as PendingVerificationRow[]
  }
  return (data ?? []) as PendingVerificationRow[]
}

export async function listRecentVerificationReviews(limit = 40): Promise<
  Array<
    VerificationReview & {
      verification?: { profile_id: string; business_name: string | null } | null
    }
  >
> {
  const { data, error } = await supabase
    .from('verification_reviews')
    .select('*, verification:contractor_verifications(profile_id, business_name)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return (data ?? []) as Array<
    VerificationReview & {
      verification?: { profile_id: string; business_name: string | null } | null
    }
  >
}

export function docTypeLabel(docType: string): string {
  const found = VERIFICATION_DOC_TYPES.find((d) => d.key === docType)
  if (found) return found.label
  return docType.replace(/_/g, ' ')
}
