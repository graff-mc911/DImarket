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

const BG = '#F5EFE6'

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
  // Slightly more padding at tiny sizes so DI stays readable in tabs
  const padRatio = size <= 32 ? 0.12 : 0.08
  const padding = Math.max(1, Math.round(size * padRatio))
  const inner = Math.max(1, size - padding * 2)
  const resized = await sharp(source)
    .resize(inner, inner, { fit: 'contain', background: { r: 245, g: 239, b: 230, alpha: 1 } })
    .png()
    .toBuffer()

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: BG,
    },
  })
    .composite([{ input: resized, gravity: 'centre' }])
    .png()
    .toBuffer()
}

async function writeSvgFromPng(pngBuffer, pixelSize = 128) {
  // Embed raster so SVG matches PNG/ICO (no system fonts / <text> drift)
  const compact = await sharp(pngBuffer)
    .resize(pixelSize, pixelSize, { fit: 'fill' })
    .png({ compressionLevel: 9 })
    .toBuffer()
  const b64 = compact.toString('base64')
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${pixelSize} ${pixelSize}" role="img" aria-label="DImarket">
  <rect width="${pixelSize}" height="${pixelSize}" fill="${BG}"/>
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

  // Horizontal mark for mobile header
  const headerH = 80
  const meta = await sharp(source).metadata()
  const scale = headerH / (meta.height || headerH)
  const headerW = Math.round((meta.width || headerH) * scale)
  await sharp(source)
    .resize(headerW, headerH, { fit: 'contain', background: { r: 245, g: 239, b: 230, alpha: 1 } })
    .png()
    .toFile(path.join(publicDir, 'logo-header.png'))
  console.log('wrote logo-header.png')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
