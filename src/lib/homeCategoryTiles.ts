import type { LucideIcon } from 'lucide-react'
import {
  Droplets,
  Grid3x3,
  Paintbrush,
  Sparkles,
  Wrench,
  Zap,
} from 'lucide-react'
import type { TranslationKey } from './i18n'
import { listingsPathForWorkGroup } from './categoryCatalog'

export interface HomeCategoryTile {
  id: string
  icon: LucideIcon
  labelKey: TranslationKey
  path: string
}

export const HOME_CATEGORY_TILES: HomeCategoryTile[] = [
  {
    id: 'electro',
    icon: Zap,
    labelKey: 'home.tile.electrician',
    path: listingsPathForWorkGroup('electro'),
  },
  {
    id: 'plumbing',
    icon: Droplets,
    labelKey: 'home.tile.plumber',
    path: listingsPathForWorkGroup('plumbing'),
  },
  {
    id: 'painting',
    icon: Paintbrush,
    labelKey: 'home.tile.painter',
    path: listingsPathForWorkGroup('painting'),
  },
  {
    id: 'tiling',
    icon: Grid3x3,
    labelKey: 'home.tile.tiler',
    path: listingsPathForWorkGroup('tiling'),
  },
  {
    id: 'cleaning',
    icon: Sparkles,
    labelKey: 'home.tile.cleaning',
    path: '/listings?category=cleaning',
  },
  {
    id: 'renovation',
    icon: Wrench,
    labelKey: 'home.tile.renovation',
    path: '/listings?category=renovation',
  },
]
