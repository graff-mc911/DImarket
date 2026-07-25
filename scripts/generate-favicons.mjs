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
const source = path.join(publicDir, 'logo-source.svg')

const BG = '#F7F8FA'
const THEME = '#1B4D3E'

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
  { file: 'mstile-150x150.png', size: 150 },
]

const maskableSizes = [
  { file: 'maskable-icon-192x192.png', size: 192 },
  { file: 'maskable-icon-512x512.png', size: 512 },
]

async function renderSquare(size, maskable = false) {
  const padding = Math.round(size * (maskable ? 0.16 : 0.06))
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

  const pinnedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="${THEME}" d="M126 364V148h90c70 0 118 43 118 108s-48 108-118 108h-90Zm58-50h31c37 0 60-22 60-58s-23-58-60-58h-31v116Zm230-130v180h-58V184h58Zm0-48v40h-58v-40h58Z"/></svg>\n`
  await fs.promises.writeFile(path.join(publicDir, 'safari-pinned-tab.svg'), pinnedSvg)
  console.log('wrote safari-pinned-tab.svg')

  // Горизонтальний знак для мобільної шапки
  const headerH = 80
  const headerW = 80
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
