import { supabase } from '../supabase'
import { createNotification } from '../notifications/notifications'
import { recomputeTrustScore } from './trustScore'

export type VerificationStatus =
  | 'unverified'
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'needs_info'

export type ReviewAction = 'approve' | 'reject' | 'request_info'

export type UserRoleKind = 'customer' | 'professional' | 'company'

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
  years_experience?: number | null
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

export type VerificationHistoryRow = {
  id: string
  verification_id?: string
  profile_id?: string
  actor_id?: string | null
  reviewer_id?: string
  action: string
  notes: string | null
  created_at: string
}

export type PendingVerificationRow = ContractorVerification & {
  profile?: {
    full_name: string | null
    email: string | null
    location: string | null
    phone?: string | null
    user_role?: string | null
    verification_level?: string | null
    trust_level?: number | null
    trust_score?: number | null
    is_verified?: boolean | null
    is_premium?: boolean | null
    identity_verified?: boolean | null
    business_verified?: boolean | null
    insurance_verified?: boolean | null
    trusted_professional?: boolean | null
  } | null
}

const BUCKET = 'verification-docs'

export const ACCEPT_MIME =
  'image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,application/pdf,.heic,.HEIC,.pdf,.jpg,.jpeg,.png'

export type DocUploadDef = {
  key: string
  label: string
  roles: UserRoleKind[]
}

export const DOC_UPLOAD_DEFS: DocUploadDef[] = [
  { key: 'id_card', label: 'Identity Card', roles: ['customer', 'professional', 'company'] },
  { key: 'passport', label: 'Passport', roles: ['customer', 'professional', 'company'] },
  { key: 'driving_license', label: 'Driving License', roles: ['customer', 'professional'] },
  { key: 'proof_of_address', label: 'Proof of Address', roles: ['customer', 'professional', 'company'] },
  { key: 'business_registration', label: 'Business Registration', roles: ['company', 'professional'] },
  { key: 'vat', label: 'VAT Certificate', roles: ['company', 'professional'] },
  { key: 'insurance', label: 'Insurance', roles: ['company', 'professional'] },
  { key: 'professional_license', label: 'Professional License', roles: ['professional', 'company'] },
  { key: 'professional_certificate', label: 'Professional Certificate', roles: ['professional'] },
  { key: 'experience_proof', label: 'Experience proof', roles: ['professional'] },
  { key: 'trade_license', label: 'Trade License', roles: ['professional', 'company'] },
]

export function docsForRole(role: UserRoleKind): DocUploadDef[] {
  return DOC_UPLOAD_DEFS.filter((d) => d.roles.includes(role))
}

export function resolveRoleKind(role: string | null | undefined, isProfessional?: boolean): UserRoleKind {
  if (role === 'company') return 'company'
  if (role === 'professional' || isProfessional) return 'professional'
  return 'customer'
}

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

  await supabase.from('verification_history').insert({
    verification_id: (data as ContractorVerification).id,
    profile_id: profileId,
    actor_id: profileId,
    action: 'created',
    notes: 'Verification request created',
  } as never)

  return data as ContractorVerification
}

export async function submitVerificationRequest(
  verificationId: string,
  profileId: string,
  fields: {
    business_name?: string
    vat_number?: string
    trade_license_ref?: string
    insurance_ref?: string
    address_line?: string
    address_city?: string
    address_country?: string
    address_postal_code?: string
    years_experience?: number | null
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

  if (error) return false

  await supabase.from('verification_history').insert({
    verification_id: verificationId,
    profile_id: profileId,
    actor_id: profileId,
    action: 'submitted',
    notes: 'Verification submitted for review',
  } as never)

  await supabase.from('verification_audit_logs').insert({
    profile_id: profileId,
    actor_id: profileId,
    action: 'submitted',
    entity_type: 'verification',
    entity_id: verificationId,
    detail: { fields },
  } as never)

  await createNotification({
    userId: profileId,
    type: 'verification',
    title: 'Verification submitted',
    body: 'Your documents were submitted. We will review them shortly.',
    linkPath: '/verification',
  })

  void recomputeTrustScore(profileId)
  return true
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

  if (!error) {
    await supabase.from('verification_history').insert({
      verification_id: verificationId,
      profile_id: profileId,
      actor_id: profileId,
      action: 'document_uploaded',
      notes: docType,
      meta: { file_name: file.name },
    } as never)
    await supabase.from('verification_audit_logs').insert({
      profile_id: profileId,
      actor_id: profileId,
      action: 'document_uploaded',
      entity_type: 'verification_document',
      entity_id: verificationId,
      detail: { doc_type: docType, path },
    } as never)
  }

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
  return Promise.all(
    docs.map(async (doc) => {
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(doc.storage_path, 60 * 60)
      return { ...doc, signed_url: signed?.signedUrl ?? doc.public_url }
    }),
  )
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
): Promise<VerificationHistoryRow[]> {
  const { data, error } = await supabase
    .from('verification_history')
    .select('*')
    .eq('verification_id', verificationId)
    .order('created_at', { ascending: false })

  if (!error && data?.length) return data as VerificationHistoryRow[]

  const fallback = await supabase
    .from('verification_reviews')
    .select('*')
    .eq('verification_id', verificationId)
    .order('created_at', { ascending: false })

  return (fallback.data ?? []) as VerificationHistoryRow[]
}

export async function adminReviewVerification(
  verificationId: string,
  reviewerId: string,
  action: ReviewAction,
  notes?: string,
): Promise<boolean> {
  const { data: rpcOk, error: rpcErr } = await supabase.rpc('admin_review_verification' as never, {
    p_verification_id: verificationId,
    p_action: action,
    p_notes: notes ?? null,
  } as never)

  if (!rpcErr && rpcOk) {
    await notifyReviewResult(verificationId, action, notes)
    return true
  }

  const status: VerificationStatus =
    action === 'approve' ? 'verified' : action === 'reject' ? 'rejected' : 'needs_info'

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
      trust_score: action === 'approve' ? 85 : action === 'reject' ? 20 : 40,
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

  if (ver?.profile_id) {
    await supabase.from('verification_history').insert({
      verification_id: verificationId,
      profile_id: ver.profile_id,
      actor_id: reviewerId,
      action,
      notes: notes ?? null,
    } as never)

    if (action === 'approve') {
      const docs = await listVerificationDocTypes(verificationId)
      const hasIdentity = docs.some((d) =>
        ['identity', 'id_card', 'passport', 'driving_license'].includes(d),
      )
      await supabase
        .from('profiles')
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
          identity_verified: hasIdentity,
          business_verified: docs.includes('business_registration'),
          insurance_verified: docs.includes('insurance'),
          address_verified: docs.includes('proof_of_address'),
          license_verified: docs.some((d) =>
            ['trade_license', 'professional_license', 'professional_certificate'].includes(d),
          ),
          vat_verified: docs.includes('vat'),
        } as never)
        .eq('id', ver.profile_id)
      void recomputeTrustScore(ver.profile_id)
    }
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
      body: 'Your verification was approved. Trust badges are now active.',
      linkPath: '/verification',
    })
  } else if (action === 'request_info') {
    await createNotification({
      userId: profileId,
      type: 'verification',
      title: 'Need additional documents',
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
    if (error) return { ok: false, error: error.message }
    void recomputeTrustScore(profileId)
    return { ok: true }
  }

  if (!opts?.phone || opts.phone.trim().length < 6) {
    return { ok: false, error: 'Add a valid phone number in Settings first.' }
  }
  const { error } = await supabase
    .from('profiles')
    .update({ phone_verified_at: new Date().toISOString() } as never)
    .eq('id', profileId)
  if (error) return { ok: false, error: error.message }
  void recomputeTrustScore(profileId)
  return { ok: true }
}

export async function listVerificationsByStatus(
  status?: VerificationStatus | 'all',
): Promise<PendingVerificationRow[]> {
  let q = supabase
    .from('contractor_verifications')
    .select(
      '*, profile:profiles(full_name, email, location, phone, user_role, verification_level, trust_level, trust_score, is_verified, is_premium, identity_verified, business_verified, insurance_verified, trusted_professional)',
    )
    .order('submitted_at', { ascending: true, nullsFirst: false })

  if (status && status !== 'all') {
    q = q.eq('status', status)
  } else {
    q = q.in('status', ['pending', 'needs_info', 'verified', 'rejected'])
  }

  const { data, error } = await q.limit(100)
  if (error) {
    const retry = await supabase
      .from('contractor_verifications')
      .select('*, profile:profiles(full_name, email, location, phone)')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: true })
    return (retry.data ?? []) as PendingVerificationRow[]
  }
  return (data ?? []) as PendingVerificationRow[]
}

export async function listPendingVerifications(): Promise<PendingVerificationRow[]> {
  return listVerificationsByStatus('pending')
}

export async function listRecentVerificationHistory(limit = 40): Promise<VerificationHistoryRow[]> {
  const { data, error } = await supabase
    .from('verification_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!error && data) return data as VerificationHistoryRow[]

  const fallback = await supabase
    .from('verification_reviews')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return (fallback.data ?? []) as VerificationHistoryRow[]
}

export function docTypeLabel(docType: string): string {
  const found = DOC_UPLOAD_DEFS.find((d) => d.key === docType)
  if (found) return found.label
  return docType.replace(/_/g, ' ')
}
