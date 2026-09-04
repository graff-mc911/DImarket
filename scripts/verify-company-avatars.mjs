/**
 * Directory avatar resolver: unique initials for masters and companies.
 * npx tsx scripts/verify-company-avatars.mjs
 */
import assert from 'assert'
import {
  companyLogoDataUri,
  companyLogoInitials,
  resolveCompanyAvatarUrl,
  resolveProfileAvatarUrl,
} from '../src/lib/directoryAvatars.ts'

assert.equal(companyLogoInitials('Geberit'), 'GE')
assert.equal(companyLogoInitials('Madrid Legal — Gestoría & Abogados'), 'ML')
assert.equal(companyLogoInitials('Kraft GmbH Darmstadt'), 'KD')
assert.equal(companyLogoInitials('B&P Bau'), 'BP')
assert.equal(companyLogoInitials('Alfonso'), 'AL')
assert.equal(companyLogoInitials('Sergio Castaneda'), 'SC')
assert.equal(companyLogoInitials(''), 'CO')

const withPhoto = resolveCompanyAvatarUrl({
  id: 'photo-id',
  full_name: 'With Photo SL',
  profile_photo: 'https://cdn.example/logo.png',
})
assert.equal(withPhoto, 'https://cdn.example/logo.png')

const generated = resolveCompanyAvatarUrl({
  id: '00000000-empty-company',
  full_name: 'Explanada Reformas',
})
assert.ok(generated.startsWith('data:image/svg+xml'), 'fallback must be an image')
assert.ok(decodeURIComponent(generated).includes('ER'))

const a = resolveCompanyAvatarUrl({ id: 'aaa', full_name: 'Alpha Build' })
const b = resolveCompanyAvatarUrl({ id: 'bbb', full_name: 'Alpha Build' })
assert.notEqual(a, b, 'same name, different id → different logo color')

const faucet = '/images/listing-themes/plumbing-faucet.jpg'
const campaign =
  'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/media/campaigns/profiles/aedc48d6-dc72-4f83-b443-4987fb8ddcaf/avatar.jpeg'
const adMedia =
  'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/b2a7e44d-128a-4cf3-9906-097efa8a7c8b/avatar.png'

const masterStock = resolveProfileAvatarUrl({
  id: 'master-alfonso',
  full_name: 'Alfonso',
  avatar_url: faucet,
  user_role: 'professional',
})
assert.ok(masterStock.startsWith('data:image/svg+xml'), 'listing-theme is not a master photo')
assert.ok(!masterStock.includes('listing-themes'))
assert.equal(masterStock, companyLogoDataUri('Alfonso', 'master-alfonso'))
assert.ok(decodeURIComponent(masterStock).includes('AL'))

const masterCampaign = resolveProfileAvatarUrl({
  id: 'master-javier',
  full_name: 'Javier',
  avatar_url: campaign,
  user_role: 'professional',
})
assert.ok(masterCampaign.startsWith('data:image/svg+xml'), 'campaign 404 URL is not a master photo')
assert.ok(decodeURIComponent(masterCampaign).includes('JA'))
assert.notEqual(masterStock, masterCampaign, 'each master gets unique initials colors')

const masterAdMedia = resolveProfileAvatarUrl({
  id: 'master-sergio',
  full_name: 'Sergio Castaneda',
  avatar_url: adMedia,
  user_role: 'professional',
})
assert.ok(masterAdMedia.startsWith('data:image/svg+xml'), 'ad-media avatar.jpeg 404 is skipped')
assert.ok(decodeURIComponent(masterAdMedia).includes('SC'))

const liveUpload = resolveProfileAvatarUrl({
  id: 'live-user',
  full_name: 'Live Master',
  avatar_url:
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/media/campaigns/profiles/live-user/avatar-1710000000-ab12cd.jpg',
  user_role: 'professional',
})
assert.ok(liveUpload.includes('avatar-1710000000'), 'timestamped live uploads stay')

const companyStock = resolveCompanyAvatarUrl({
  id: 'company-gd',
  full_name: 'GD Asesoría — Madrid',
  avatar_url: faucet,
})
const companyStock2 = resolveCompanyAvatarUrl({
  id: 'company-bric',
  full_name: 'Bric Madera',
  avatar_url: faucet,
})
assert.notEqual(companyStock, companyStock2, 'stock faucet must not be reused across companies')
assert.ok(companyStock.startsWith('data:image/svg+xml'))
assert.ok(companyStock2.startsWith('data:image/svg+xml'))
assert.ok(decodeURIComponent(companyStock).includes('GA'))

console.log('✓ company avatar checks passed')
