/**
 * Копіює оригінальні банери з assets → public/ads/brands/<slug>.png
 * Запуск: node scripts/sync-brand-banners.mjs
 */
import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const assets = resolve(
  root,
  '../.cursor/projects/c-Users-PC-Documents-DImarket/assets',
)
const altAssets = resolve(
  'C:/Users/PC/.cursor/projects/c-Users-PC-Documents-DImarket/assets',
)
const outDir = resolve(root, 'public/ads/brands')

const ASSET_DIR = existsSync(assets) ? assets : altAssets

const P = 'c__Users_PC_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_22_____._2026__'

/** slug → файл у assets (оригінальні завантаження) */
const MAP = {
  knauf: `${P}.__21_18_28-83c94104-c2f5-4acc-a78d-f5f35f6f3e17.png`,
  dewalt: `${P}.__21_18_21-af625bfd-a618-4985-be36-6c5649c264e6.png`,
  festool: `${P}.__21_17_59-70e4a014-0d94-49b7-ab73-fa88b0fa412f.png`,
  hilti: `${P}.__21_18_59-3632d221-ab6b-40ce-9ed1-93ae862efbc5.png`,
  gree: `${P}.__21_18_12-afc6c3de-9a79-4b08-a3d6-5fb4b567c790.png`,
  uponor: `${P}.__21_18_44-278f0377-598f-41cf-b0e5-12e97df4c35f.png`,
  velux: `${P}.__21_18_52-1a5515ce-d471-4ad5-b515-11dd1ba9028b.png`,
  geberit: `${P}.__21_18_37-873c0cb5-2464-4bed-8762-8c80efcc000e.png`,
  philips:
    'c__Users_PC_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_1e39f734-8ff3-4969-bd44-39946d2cb58b-4d99e20a-dd53-4934-b0e0-8404fc59d3b2.png',
}

mkdirSync(outDir, { recursive: true })

for (const [slug, file] of Object.entries(MAP)) {
  const src = resolve(ASSET_DIR, file)
  const dest = resolve(outDir, `${slug}.png`)
  if (!existsSync(src)) {
    console.error('Missing:', src)
    process.exit(1)
  }
  copyFileSync(src, dest)
  console.log('OK', slug)
}
