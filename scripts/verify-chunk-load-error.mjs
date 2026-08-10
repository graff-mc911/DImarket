/** Quick sanity check for chunk-load error detection (no test runner required). */

function isChunkLoadError(error) {
  const msg = error instanceof Error ? error.message : String(error ?? '')
  const name = error instanceof Error ? error.name : ''
  return (
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    /Loading chunk [\w-]+ failed/i.test(msg) ||
    /Loading CSS chunk [\w-]+ failed/i.test(msg) ||
    name === 'ChunkLoadError'
  )
}

const cases = [
  [
    true,
    new Error(
      'Failed to fetch dynamically imported module: https://dimarket.app/assets/Listings-old.js',
    ),
  ],
  [true, new Error('Importing a module script failed.')],
  [true, new Error('Loading chunk 5 failed')],
  [true, Object.assign(new Error('x'), { name: 'ChunkLoadError' })],
  [false, new Error('something unrelated')],
]

let failed = 0
for (const [expected, err] of cases) {
  const got = isChunkLoadError(err)
  if (got !== expected) {
    failed += 1
    console.error('FAIL', { expected, got, msg: err.message })
  }
}

if (failed) {
  console.error(`chunk-load detection: ${failed} failed`)
  process.exit(1)
}
console.log('chunk-load detection: ok')
