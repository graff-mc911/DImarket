/**
 * Generate every DImarket platform icon from public/logo-source.png
 * Run: npm run icons:generate
 *
 * Does NOT redesign — only resize / pad / package the master artwork.
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

/** Master plate background (matches icon charcoal) */
const BG = '#1A1C22'
const THEME = '#1A1C22'

const obsolete = [
  'favicon-16x16.png',
  'favicon-32x32.png',
  'favicon-48x48.png',
  'favicon-96x96.png',
  'apple-touch-icon-120x120.png',
  'apple-touch-icon-152x152.png',
  'apple-touch-icon-167x167.png',
  'twitter-image.png',
  'logo-source-candidate.png',
]

async function renderAny(size) {
  return sharp(source)
    .resize(size, size, {
      fit: 'cover',
      position: 'centre',
      kernel: sharp.kernel.lanczos3,
    })
    .flatten({ background: BG })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer()
}

/** Maskable: keep logo in safe zone (~20% padding) on solid brand background */
async function renderMaskable(size) {
  const pad = Math.round(size * 0.18)
  const inner = size - pad * 2
  const logo = await sharp(source)
    .resize(inner, inner, {
      fit: 'contain',
      background: { r: 26, g: 28, b: 34, alpha: 1 },
      kernel: sharp.kernel.lanczos3,
    })
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
    .composite([{ input: logo, gravity: 'centre' }])
    .png({ compressionLevel: 9 })
    .toBuffer()
}

async function writeSvgFavicon(png512) {
  const compact = await sharp(png512)
    .resize(180, 180, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
    .png({ compressionLevel: 9 })
    .toBuffer()
  const b64 = compact.toString('base64')
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" role="img" aria-label="DImarket">
  <image width="180" height="180" href="data:image/png;base64,${b64}"/>
</svg>
`
  await fs.promises.writeFile(path.join(publicDir, 'favicon.svg'), svg)
  console.log('wrote favicon.svg')
}

/** Safari pinned tab: black silhouette of the master mark */
async function writePinnedTabSvg() {
  const silhouette = await sharp(source)
    .resize(512, 512, { fit: 'cover' })
    .ensureAlpha()
    .modulate({ brightness: 1 })
    .greyscale()
    .threshold(28)
    .negate({ alpha: false })
    .png()
    .toBuffer()

  // Force pure black marks on transparent: extract bright pixels as black
  const { data, info } = await sharp(silhouette)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  for (let i = 0; i < data.length; i += 4) {
    const lum = data[i]
    if (lum > 128) {
      data[i] = 0
      data[i + 1] = 0
      data[i + 2] = 0
      data[i + 3] = 255
    } else {
      data[i + 3] = 0
    }
  }

  const masked = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .resize(160, 160)
    .png()
    .toBuffer()

  const b64 = masked.toString('base64')
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" role="img" aria-label="DImarket">
  <image width="16" height="16" href="data:image/png;base64,${b64}"/>
</svg>
`
  const pinnedPath = path.join(publicDir, 'safari-pinned-tab.svg')
  await fs.promises.writeFile(pinnedPath, svg)
  await fs.promises.copyFile(pinnedPath, path.join(publicDir, 'pinned-tab.svg'))
  console.log('wrote safari-pinned-tab.svg + pinned-tab.svg')
}

async function writeSocial(file, width, height) {
  const side = Math.round(Math.min(width, height) * 0.62)
  const logo = await sharp(source)
    .resize(side, side, {
      fit: 'contain',
      background: { r: 26, g: 28, b: 34, alpha: 1 },
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer()

  await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: BG,
    },
  })
    .composite([{ input: logo, gravity: 'centre' }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(publicDir, file))
  console.log('wrote', file)
}

async function writeManifest() {
  const manifest = {
    name: 'DImarket',
    short_name: 'DImarket',
    description: 'Маркетплейс для будівництва, ремонту та послуг',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: THEME,
    theme_color: THEME,
    lang: 'uk',
    icons: [
      {
        src: '/favicon-32.png',
        sizes: '32x32',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/maskable-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/maskable-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
  const json = JSON.stringify(manifest, null, 2) + '\n'
  await fs.promises.writeFile(path.join(publicDir, 'manifest.webmanifest'), json)
  await fs.promises.writeFile(path.join(publicDir, 'manifest.json'), json)
  console.log('wrote manifest.webmanifest + manifest.json')
}

async function writeBrowserConfig() {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="/mstile-150x150.png"/>
      <TileColor>${THEME}</TileColor>
    </tile>
  </msapplication>
</browserconfig>
`
  await fs.promises.writeFile(path.join(publicDir, 'browserconfig.xml'), xml)
  console.log('wrote browserconfig.xml')
}

async function main() {
  if (!fs.existsSync(source)) {
    console.error('Missing public/logo-source.png — place the master DImarket PNG there.')
    process.exit(1)
  }

  for (const file of obsolete) {
    const p = path.join(publicDir, file)
    if (fs.existsSync(p)) {
      await fs.promises.unlink(p)
      console.log('removed obsolete', file)
    }
  }

  const sizes = {
    'favicon-16.png': 16,
    'favicon-32.png': 32,
    'favicon-48.png': 48,
    'apple-touch-icon.png': 180,
    'mstile-150x150.png': 150,
    'android-chrome-192x192.png': 192,
    'android-chrome-512x512.png': 512,
    'icon-192.png': 192,
    'icon-512.png': 512,
  }

  const icoBuffers = []
  let png512 = null

  for (const [file, size] of Object.entries(sizes)) {
    const buf = await renderAny(size)
    await fs.promises.writeFile(path.join(publicDir, file), buf)
    console.log('wrote', file)
    if ([16, 32, 48].includes(size)) icoBuffers.push(buf)
    if (size === 512 && file === 'android-chrome-512x512.png') png512 = buf
  }

  for (const size of [192, 512]) {
    const file = `maskable-icon-${size}.png`
    const buf = await renderMaskable(size)
    await fs.promises.writeFile(path.join(publicDir, file), buf)
    console.log('wrote', file)
  }

  const ico = await pngToIco(icoBuffers)
  await fs.promises.writeFile(path.join(publicDir, 'favicon.ico'), ico)
  console.log('wrote favicon.ico')

  if (!png512) png512 = await renderAny(512)
  await writeSvgFavicon(png512)
  await writePinnedTabSvg()

  await writeSocial('og-image.png', 1200, 630)
  await writeSocial('twitter-card.png', 1200, 600)
  await writeSocial('social-preview.png', 1200, 630)

  // Convenience copies
  await sharp(source)
    .resize(512, 512, { fit: 'cover', kernel: sharp.kernel.lanczos3 })
    .png()
    .toFile(path.join(publicDir, 'logo-full.png'))
  await sharp(source)
    .resize(160, 160, { fit: 'cover', kernel: sharp.kernel.lanczos3 })
    .png()
    .toFile(path.join(publicDir, 'logo-header.png'))
  console.log('wrote logo-full.png, logo-header.png')

  await writeManifest()
  await writeBrowserConfig()

  console.log('Done. Master:', source)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
