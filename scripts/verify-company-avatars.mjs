/**
 * Company avatar resolver: every Top Company must resolve to an image URL.
 * node --experimental-strip-types --experimental-specifier-resolution=node scripts/verify-company-avatars.mjs
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

console.log('✓ company avatar checks passed')
