/**
 * Generates browser / PWA icons from public/logo-source.svg
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
const iconsDir = path.join(publicDir, 'icons')
const source = path.join(publicDir, 'logo-source.svg')

const BG = '#1F2937'
const THEME = '#1F2937'

const pngSizes = [
  { file: 'favicon-16.png', size: 16 },
  { file: 'favicon-32.png', size: 32 },
  { file: 'favicon-16x16.png', size: 16 },
  { file: 'favicon-32x32.png', size: 32 },
  { file: 'favicon-48x48.png', size: 48 },
  { file: 'favicon-96x96.png', size: 96 },
  { file: 'apple-touch-icon-120x120.png', size: 120 },
  { file: 'apple-touch-icon-152x152.png', size: 152 },
  { file: 'apple-touch-icon-167x167.png', size: 167 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'pwa-icon.png', size: 512 },
  { file: 'android-chrome-192x192.png', size: 192 },
  { file: 'android-chrome-512x512.png', size: 512 },
  { file: 'mstile-150x150.png', size: 150 },
]

const maskableSizes = [
  { file: 'maskable-icon-192x192.png', size: 192 },
  { file: 'maskable-icon-512x512.png', size: 512 },
  { file: 'maskable-icon.png', size: 512 },
]

const iconSizes = [
  1024,
  512,
  256,
  192,
  180,
  167,
  152,
  120,
  96,
  64,
  48,
  32,
  16,
]

async function renderSquare(size, maskable = false) {
  const padding = Math.round(size * (maskable ? 0.08 : 0))
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
      background: maskable ? THEME : BG,
    },
  })
    .composite([{ input: resized, gravity: 'centre' }])
    .png()
    .toBuffer()
}

async function main() {
  if (!fs.existsSync(source)) {
    console.error('Missing public/logo-source.svg')
    process.exit(1)
  }

  await fs.promises.mkdir(iconsDir, { recursive: true })
  const icoBuffers = []

  for (const size of iconSizes) {
    const buf = await renderSquare(size)
    const out = path.join(iconsDir, `icon-${size}.png`)
    await fs.promises.writeFile(out, buf)
    console.log('wrote', `icons/icon-${size}.png`)
  }

  for (const { file, size } of pngSizes) {
    const buf = await renderSquare(size)
    const out = path.join(publicDir, file)
    await fs.promises.writeFile(out, buf)
    console.log('wrote', file)

    if (['favicon-16.png', 'favicon-32.png', 'favicon-48x48.png'].includes(file)) {
      icoBuffers.push(buf)
    }
  }

  for (const { file, size } of maskableSizes) {
    const buf = await renderSquare(size, true)
    const out = path.join(publicDir, file)
    await fs.promises.writeFile(out, buf)
    console.log('wrote', file)
  }

  const ico = await pngToIco(icoBuffers)
  await fs.promises.writeFile(path.join(publicDir, 'favicon.ico'), ico)
  console.log('wrote favicon.ico')

  await fs.promises.copyFile(source, path.join(publicDir, 'favicon.svg'))
  console.log('wrote favicon.svg')

  const pinnedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="${THEME}" d="M232 652V210h206c142 0 236 84 236 221S580 652 438 652H232Zm114-96h88c76 0 124-46 124-125S510 306 434 306h-88v250Zm294-324h142v420H640c76-88 76-332 0-420Z"/></svg>\n`
  await fs.promises.writeFile(path.join(publicDir, 'safari-pinned-tab.svg'), pinnedSvg)
  console.log('wrote safari-pinned-tab.svg')

  console.log('header logo left unchanged')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
