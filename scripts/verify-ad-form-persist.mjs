/** URL + draft flag smoke for advertising composer persistence. */
function syncOwnerAdsUrlState(loc, opts) {
  const url = new URL(loc.href)
  if (!url.pathname.startsWith('/dashboard')) return loc.href
  if (!opts.formOpen) {
    url.searchParams.delete('ads')
    url.searchParams.delete('adId')
  } else if (opts.editingId) {
    url.searchParams.set('ads', 'edit')
    url.searchParams.set('adId', opts.editingId)
  } else {
    url.searchParams.set('ads', 'create')
    url.searchParams.delete('adId')
  }
  return `${url.pathname}${url.search}${url.hash}`
}

function readOwnerAdsUrlState(search) {
  const params = new URLSearchParams(search)
  const ads = params.get('ads')
  const adId = params.get('adId')
  if (ads === 'edit' && adId) return { formOpen: true, editingId: adId }
  if (ads === 'create') return { formOpen: true, editingId: null }
  return { formOpen: false, editingId: null }
}

let href = 'https://dimarket.app/dashboard'
href = 'https://dimarket.app' + syncOwnerAdsUrlState({ href }, { formOpen: true, editingId: null })
let st = readOwnerAdsUrlState(new URL(href).search)
if (!st.formOpen || st.editingId !== null) throw new Error('create url failed')

href = 'https://dimarket.app' + syncOwnerAdsUrlState({ href }, { formOpen: true, editingId: 'abc' })
st = readOwnerAdsUrlState(new URL(href).search)
if (!st.formOpen || st.editingId !== 'abc') throw new Error('edit url failed')

href = 'https://dimarket.app' + syncOwnerAdsUrlState({ href }, { formOpen: false, editingId: null })
st = readOwnerAdsUrlState(new URL(href).search)
if (st.formOpen) throw new Error('close url failed')

function syncCompose(pathname, search, active) {
  const url = new URL(`https://dimarket.app${pathname}${search}`)
  if (!url.pathname.startsWith('/advertising')) return url.search
  if (active) url.searchParams.set('compose', '1')
  else url.searchParams.delete('compose')
  return url.search
}
let s = syncCompose('/advertising', '', true)
if (!s.includes('compose=1')) throw new Error('compose on failed')
s = syncCompose('/advertising', '?compose=1', false)
if (s.includes('compose=')) throw new Error('compose off failed')

console.log('ok ad form persist helpers')
