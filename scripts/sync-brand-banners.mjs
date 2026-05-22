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

/** slug → файл у assets (оригінальні завантаження) */
const MAP = {
  knauf: 'c__Users_PC_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_22_____._2026__.__21_18_28-e864f8cf-5d9d-44c3-b4f3-b5c6a9f11802.png',
  dewalt:
    'c__Users_PC_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_22_____._2026__.__21_18_21-516e755d-acce-45f3-a7e6-f06e2b986f62.png',
  festool:
    'c__Users_PC_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_22_____._2026__.__21_17_59-62f81c21-f82d-4e1c-bb8f-f9f82404eb83.png',
  hilti: 'c__Users_PC_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_22_____._2026__.__21_18_59-d82d643c-c68b-49f8-b675-0803a99e5cd1.png',
  gree: 'c__Users_PC_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_22_____._2026__.__21_18_12-8183b52f-98ac-43e3-9e1d-5d85202d8e4f.png',
  uponor:
    'c__Users_PC_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_22_____._2026__.__21_18_44-33687af1-983d-451b-835b-fb67574d161d.png',
  velux:
    'c__Users_PC_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_22_____._2026__.__21_18_52-2512bef0-34ef-413e-a311-d641846d4eda.png',
  geberit:
    'c__Users_PC_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_22_____._2026__.__21_18_37-175fab36-2c83-4c5c-941e-69c15398c599.png',
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
