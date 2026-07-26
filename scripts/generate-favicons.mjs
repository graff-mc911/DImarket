/**
 * Generates browser / PWA icons from public/logo-source.png
 * Run: node scripts/generate-favicons.mjs
 *
 * All formats (PNG, ICO, SVG) share the same rendered artwork so
 * Chrome / Firefox / Safari / Edge show a consistent tab icon.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const publicDir = path.join(root, 'public')
const source = path.join(publicDir, 'logo-source.png')

/** Matches the dark app-icon plate (no cream letterbox) */
const BG = '#0B1424'

const pngSizes = [
  { file: 'favicon-16x16.png', size: 16 },
  { file: 'favicon-32x32.png', size: 32 },
  { file: 'favicon-48x48.png', size: 48 },
  { file: 'favicon-96x96.png', size: 96 },
  { file: 'apple-touch-icon-120x120.png', size: 120 },
  { file: 'apple-touch-icon-152x152.png', size: 152 },
  { file: 'apple-touch-icon-167x167.png', size: 167 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'mstile-150x150.png', size: 150 },
  { file: 'android-chrome-192x192.png', size: 192 },
  { file: 'android-chrome-512x512.png', size: 512 },
]

async function renderSquare(size) {
  // Source is already a finished square app icon — scale edge-to-edge
  return sharp(source)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .flatten({ background: BG })
    .png()
    .toBuffer()
}

async function writeSvgFromPng(pngBuffer, pixelSize = 128) {
  const compact = await sharp(pngBuffer)
    .resize(pixelSize, pixelSize, { fit: 'fill' })
    .png({ compressionLevel: 9 })
    .toBuffer()
  const b64 = compact.toString('base64')
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${pixelSize} ${pixelSize}" role="img" aria-label="DImarket">
  <image width="${pixelSize}" height="${pixelSize}" href="data:image/png;base64,${b64}"/>
</svg>
`
  await fs.promises.writeFile(path.join(publicDir, 'favicon.svg'), svg)
  console.log('wrote favicon.svg', `(${compact.length} png bytes)`)
}

async function main() {
  if (!fs.existsSync(source)) {
    console.error('Missing public/logo-source.png')
    process.exit(1)
  }

  const icoBuffers = []
  let master512 = null

  for (const { file, size } of pngSizes) {
    const buf = await renderSquare(size)
    const out = path.join(publicDir, file)
    await fs.promises.writeFile(out, buf)
    console.log('wrote', file)

    if ([16, 32, 48].includes(size)) {
      icoBuffers.push(buf)
    }
    if (size === 512) master512 = buf
  }

  const ico = await pngToIco(icoBuffers)
  await fs.promises.writeFile(path.join(publicDir, 'favicon.ico'), ico)
  console.log('wrote favicon.ico')

  if (master512) {
    await writeSvgFromPng(master512)
  }

  // Square mark for header / notifications (same artwork)
  await sharp(source)
    .resize(160, 160, { fit: 'cover', position: 'centre' })
    .png()
    .toFile(path.join(publicDir, 'logo-header.png'))
  console.log('wrote logo-header.png')

  // Full-size public copy for OG / sharing when needed
  await sharp(source)
    .resize(512, 512, { fit: 'cover', position: 'centre' })
    .png()
    .toFile(path.join(publicDir, 'logo-full.png'))
  console.log('wrote logo-full.png')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
