/**
 * Generates browser / PWA icons from public/logo-source.png
 * Run: node scripts/generate-favicons.mjs
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
  { file: 'android-chrome-192x192.png', size: 192 },
  { file: 'android-chrome-512x512.png', size: 512 },
]

async function renderSquare(size) {
  const padding = Math.round(size * 0.08)
  const inner = size - padding * 2
  const resized = await sharp(source)
    .resize(inner, inner, { fit: 'contain', background: BG })
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

async function main() {
  if (!fs.existsSync(source)) {
    console.error('Missing public/logo-source.png')
    process.exit(1)
  }

  const icoBuffers = []

  for (const { file, size } of pngSizes) {
    const buf = await renderSquare(size)
    const out = path.join(publicDir, file)
    await fs.promises.writeFile(out, buf)
    console.log('wrote', file)

    if ([16, 32, 48].includes(size)) {
      icoBuffers.push(buf)
    }
  }

  const ico = await pngToIco(icoBuffers)
  await fs.promises.writeFile(path.join(publicDir, 'favicon.ico'), ico)
  console.log('wrote favicon.ico')

  // Горизонтальний знак для мобільної шапки
  const headerH = 80
  const meta = await sharp(source).metadata()
  const scale = headerH / (meta.height || headerH)
  const headerW = Math.round((meta.width || headerH) * scale)
  await sharp(source)
    .resize(headerW, headerH, { fit: 'contain', background: BG })
    .png()
    .toFile(path.join(publicDir, 'logo-header.png'))
  console.log('wrote logo-header.png')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
