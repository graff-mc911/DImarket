/**
 * Company avatar resolver: every Top Company must resolve to an image URL.
 * npx tsx scripts/verify-company-avatars.mjs
 */
import assert from 'assert'
import {
  companyLogoInitials,
  resolveCompanyAvatarUrl,
} from '../src/lib/directoryAvatars.ts'

assert.equal(companyLogoInitials('Geberit'), 'GE')
assert.equal(companyLogoInitials('Madrid Legal — Gestoría & Abogados'), 'ML')
assert.equal(companyLogoInitials('Kraft GmbH Darmstadt'), 'KD')
assert.equal(companyLogoInitials('B&P Bau'), 'BP')
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

const masterStock = resolveCompanyAvatarUrl({
  id: 'master-alfonso',
  full_name: 'Alfonso',
  avatar_url: faucet,
})
assert.ok(masterStock.startsWith('data:image/svg+xml'), 'listing-theme is not a master photo')
assert.ok(decodeURIComponent(masterStock).includes('AL'))

const masterCampaign = resolveCompanyAvatarUrl({
  id: 'master-javier',
  full_name: 'Javier',
  avatar_url: campaign,
})
assert.ok(masterCampaign.startsWith('data:image/svg+xml'), 'campaign 404 URL is not a master photo')

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

console.log('✓ company avatar checks passed')
