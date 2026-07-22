import { supabase } from '../supabase'
import { createNotification } from '../notifications/notifications'

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected'

export type ContractorVerification = {
  id: string
  profile_id: string
  status: VerificationStatus
  business_name: string | null
  vat_number: string | null
  trust_score: number | null
  submitted_at: string | null
  review_notes: string | null
}

const BUCKET = 'verification-docs'

export async function getOrCreateVerification(profileId: string): Promise<ContractorVerification | null> {
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
  fields: { business_name?: string; vat_number?: string; trade_license_ref?: string; insurance_ref?: string },
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
  const path = `${profileId}/${verificationId}/${docType}-${Date.now()}-${file.name}`
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false })
  if (upErr) {
    console.error('uploadVerificationDoc:', upErr)
    return false
  }

  const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 7)
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

export async function adminReviewVerification(
  verificationId: string,
  reviewerId: string,
  action: 'approve' | 'reject',
  notes?: string,
): Promise<boolean> {
  const status = action === 'approve' ? 'verified' : 'rejected'
  const trust = action === 'approve' ? 85 : 20

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
    await supabase.from('profiles').update({ is_verified: true }).eq('id', ver.profile_id)
    await createNotification({
      userId: ver.profile_id,
      type: 'verification',
      title: 'Verification approved',
      body: 'Your contractor verification was approved.',
      linkPath: '/verification',
    })
  } else if (ver?.profile_id) {
    await createNotification({
      userId: ver.profile_id,
      type: 'verification',
      title: 'Verification update',
      body: notes || 'Your verification needs changes.',
      linkPath: '/verification',
    })
  }

  return true
}

export async function listVerificationDocTypes(verificationId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('verification_documents')
    .select('doc_type')
    .eq('verification_id', verificationId)

  if (error || !data) return []
  return [...new Set((data as { doc_type: string }[]).map((d) => d.doc_type))]
}

export async function markContactVerified(
  profileId: string,
  kind: 'email' | 'phone',
): Promise<boolean> {
  const patch =
    kind === 'email'
      ? { email_verified_at: new Date().toISOString() }
      : { phone_verified_at: new Date().toISOString() }
  const { error } = await supabase.from('profiles').update(patch as never).eq('id', profileId)
  return !error
}

export async function listPendingVerifications() {
  const { data, error } = await supabase
    .from('contractor_verifications')
    .select('*, profile:profiles(full_name, email, location)')
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true })

  if (error) return []
  return data ?? []
}
