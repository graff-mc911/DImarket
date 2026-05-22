/**
 * Оновлює медіа партнерської реклами в Supabase (REST, без SQL Editor).
 *
 * .env.local:
 *   SUPABASE_SERVICE_ROLE_KEY  — Settings → API → service_role
 * або
 *   SUPABASE_ACCESS_TOKEN      — Account → Access Tokens (sbp_...)
 *
 * node scripts/apply-partner-media-migration.mjs
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnvFile(name) {
  const path = resolve(root, name)
  if (!existsSync(path)) return {}
  const out = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 1) continue
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '')
  }
  return out
}

const env = { ...loadEnvFile('.env'), ...loadEnvFile('.env.local'), ...process.env }
const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
const accessToken = env.SUPABASE_ACCESS_TOKEN
const projectRef = 'wjlfvajloxkevggwjgtk'
const sqlPath = resolve(root, 'supabase/migrations/20260523140000_partner_ads_real_media.sql')
const sql = readFileSync(sqlPath, 'utf8')

if (!url) {
  console.error('VITE_SUPABASE_URL не знайдено')
  process.exit(1)
}

if (accessToken) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })
  const body = await res.text()
  if (!res.ok) {
    console.error('Management API:', res.status, body)
    process.exit(1)
  }
  console.log('OK: migration applied via Management API')
} else if (serviceKey) {
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const updates = [
    {
      id: 'f81e653d-ca9e-4081-a4ca-2a17395e9924',
      title: 'Knauf — мінеральна вата та фасадні системи',
      description:
        'Теплоізоляція, гіпсокартон і ETICS для ремонту та новобудов. Офіційні системи Knauf для України.',
      image_url:
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&h=560&fit=crop&q=85',
      media_url: 'https://videos.pexels.com/video-files/3999009/3999009-uhd_2560_1440_25fps.mp4',
      media_type: 'video',
    },
    {
      id: '89623059-83ca-4151-9f09-8fcfcb8ed889',
      title: 'Bosch Professional — акумуляторний інструмент',
      description:
        'Дрилі, шуруповерти, лазерні нівеліри та сервіс Bosch для монтажників на об\'єкті.',
      image_url:
        'https://images.unsplash.com/photo-1572981776447-47a21a0fbb7f?w=900&h=560&fit=crop&q=85',
      media_url: 'https://videos.pexels.com/video-files/3209624/3209624-uhd_2560_1440_25fps.mp4',
      media_type: 'video',
    },
    {
      id: '0431275c-451e-47ed-a7a7-44167a577a29',
      title: 'Würth — кріплення та витратні матеріали',
      description:
        'Анкери, дюбелі, хімічні кріплення та доставка на будмайданчик одним постачальником.',
      image_url:
        'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=900&h=560&fit=crop&q=85',
      media_url: 'https://videos.pexels.com/video-files/4485575/4485575-uhd_2560_1440_25fps.mp4',
      media_type: 'video',
    },
    {
      id: '1ec41ada-4feb-4a36-b1a9-8494622ea30f',
      title: 'Hilti — перфоратори та алмазне свердління',
      description:
        'Професійний інструмент, анкери та оренда обладнання Hilti для підрядників.',
      image_url:
        'https://images.unsplash.com/photo-1504148455328-c376907d0c8f?w=900&h=560&fit=crop&q=85',
      media_url: 'https://videos.pexels.com/video-files/2176904/2176904-uhd_2560_1440_30fps.mp4',
      media_type: 'video',
    },
    {
      id: '28885e84-4be9-4ba7-8fa8-fac766c5f1f8',
      title: 'Baumit — декоративні штукатурки та ETICS',
      description:
        'Фасадні системи, утеплення та фінішні покриття Baumit для житла і комерції.',
      image_url:
        'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=900&h=560&fit=crop&q=85',
      media_url: 'https://media.giphy.com/media/264upSWYOxr9S/giphy.gif',
      media_type: 'gif',
    },
    {
      id: '807b9715-ddcd-4d1f-b651-711a880a2c77',
      title: 'Uponor — труби PEX та опалення',
      description: 'Системи водопостачання, теплої підлоги та монтажні комплекти Uponor.',
      image_url:
        'https://images.unsplash.com/photo-1585704032915-8ig20df24b8e?w=900&h=560&fit=crop&q=85',
      media_url: 'https://media.giphy.com/media/l46Cy8ZBn7JDzR6Uw/giphy.gif',
      media_type: 'gif',
    },
    {
      id: '6097ef50-bb68-4041-b83f-32ecee542aad',
      title: 'VELUX — мансардні вікна та світлові тунелі',
      description: 'Вікна, жалюзі та монтажні комплекти для дахів і мансард.',
      image_url:
        'https://images.unsplash.com/photo-1632776043539-6aedd71a6190?w=900&h=560&fit=crop&q=85',
      media_url: 'https://media.giphy.com/media/3o7TKqnN349PBUtRhi/giphy.gif',
      media_type: 'gif',
    },
    {
      id: '69df3b9f-c702-4028-b998-fc3734dc76ed',
      title: 'Geberit — інсталяції та зливні системи',
      description:
        'Сховані інсталяції, зливні арматури та рішення для ванних кімнат у новобудовах.',
      image_url:
        'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=900&h=560&fit=crop&q=85',
      media_url:
        'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=900&h=560&fit=crop&q=85',
      media_type: 'image',
    },
  ]

  for (const row of updates) {
    const { id, ...patch } = row
    const { error } = await admin.from('ad_campaigns').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) console.error('Update', id, error.message)
    else console.log('Updated', id.slice(0, 8), patch.media_type)
  }

  console.warn('INSERT для Rockwool/Ceresit/Weber/Sika — виконайте повний SQL у Dashboard або додайте SUPABASE_ACCESS_TOKEN')
} else {
  console.error(
    'Додайте SUPABASE_SERVICE_ROLE_KEY або SUPABASE_ACCESS_TOKEN у .env.local\n' +
      `Або SQL вручну: https://supabase.com/dashboard/project/${projectRef}/sql/new\n` +
      sqlPath,
  )
  process.exit(1)
}

const anonKey = env.VITE_SUPABASE_ANON_KEY
if (anonKey) {
  const pub = createClient(url, anonKey)
  const { data } = await pub
    .from('ad_campaigns')
    .select('title,media_type')
    .eq('status', 'active')
    .limit(12)
  console.log('Verify:', data?.map((r) => `${r.media_type}: ${r.title?.slice(0, 30)}`).join('\n  '))
}
