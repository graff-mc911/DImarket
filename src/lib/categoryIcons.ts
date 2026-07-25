import type { LucideIcon } from 'lucide-react'
import {
  Aperture,
  Boxes,
  BrickWall,
  Building2,
  Cpu,
  Droplets,
  Fence,
  Flame,
  GlassWater,
  Grid3x3,
  Hammer,
  HardHat,
  Home,
  Layers,
  Paintbrush,
  PaintBucket,
  PanelsTopLeft,
  Ruler,
  Shovel,
  Square,
  Sun,
  Thermometer,
  Trees,
  Waves,
  Wind,
  Wrench,
  Zap,
} from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  hammer: Hammer,
  shovel: Shovel,
  'building-2': Building2,
  boxes: Boxes,
  'brick-wall': BrickWall,
  home: Home,
  building: Building2,
  layers: Layers,
  paintbrush: Paintbrush,
  'paint-bucket': PaintBucket,
  'panels-top-left': PanelsTopLeft,
  square: Square,
  footprint: Layers,
  wrench: Wrench,
  aperture: Aperture,
  droplets: Droplets,
  zap: Zap,
  flame: Flame,
  fence: Fence,
  hardhat: HardHat,
  trees: Trees,
  waves: Waves,
  sun: Sun,
  cpu: Cpu,
  ruler: Ruler,
  glass: GlassWater,
  'grid-3x3': Grid3x3,
  wind: Wind,
  thermometer: Thermometer,
}

/** Soft tinted backgrounds + stronger icon accents per trade */
const COLOR_BY_SLUG: Record<string, { bg: string; fg: string; ring: string }> = {
  demolition: { bg: '#fff1e8', fg: '#d35400', ring: '#ffd0b0' },
  earthworks: { bg: '#f3efe6', fg: '#8b6914', ring: '#e4d7b5' },
  foundation: { bg: '#eef2f7', fg: '#3d5a80', ring: '#c9d6e8' },
  concrete: { bg: '#f0f1f3', fg: '#5c6570', ring: '#d0d5dc' },
  masonry: { bg: '#fdecea', fg: '#c0392b', ring: '#f5c4be' },
  roofing: { bg: '#eef6fb', fg: '#1e6f9f', ring: '#b9d9ee' },
  facade: { bg: '#f5eef8', fg: '#7d3c98', ring: '#ddc6e8' },
  plastering: { bg: '#f7f3ea', fg: '#a67c52', ring: '#e4d4bc' },
  painting: { bg: '#fff4e8', fg: '#e67e22', ring: '#ffd7ad' },
  wallpaper: { bg: '#fdf0f5', fg: '#c2185b', ring: '#f3c2d4' },
  drywall: { bg: '#eef8f4', fg: '#1e8449', ring: '#b9e2cd' },
  tiling: { bg: '#eef5ff', fg: '#2471a3', ring: '#bdd4f0' },
  flooring: { bg: '#f8f1e7', fg: '#9a5b2e', ring: '#e5cdb3' },
  carpentry: { bg: '#f6efe6', fg: '#a04000', ring: '#e2c9ad' },
  windows: { bg: '#eaf6fb', fg: '#148fad', ring: '#b5e0ee' },
  plumbing: { bg: '#eaf4ff', fg: '#1a73e8', ring: '#b7d4ff' },
  electro: { bg: '#fff8e6', fg: '#f39c12', ring: '#ffe2a3' },
  hvac: { bg: '#eaf8fb', fg: '#117a8b', ring: '#b5e2ea' },
  insulation: { bg: '#f3f8ee', fg: '#5d8a2f', ring: '#d0e3b8' },
  welding: { bg: '#fff0eb', fg: '#e74c3c', ring: '#ffc9bc' },
  metal: { bg: '#eef1f5', fg: '#566573', ring: '#c8d0da' },
  glass: { bg: '#eaf7fb', fg: '#1abc9c', ring: '#b6e8de' },
  landscaping: { bg: '#eef8ef', fg: '#27ae60', ring: '#bce8c9' },
  pools: { bg: '#e8f6fc', fg: '#2980b9', ring: '#b4daf0' },
  solar: { bg: '#fff8e1', fg: '#d4a017', ring: '#ffe9a0' },
  'smart-home': { bg: '#f0eefb', fg: '#6c5ce7', ring: '#d2ccf5' },
  'design-engineering': { bg: '#f4f0ea', fg: '#7f5539', ring: '#dfcfc0' },
}

const DEFAULT_COLOR = { bg: '#fff4e8', fg: '#c96d2c', ring: '#ffd7ad' }

export function resolveCategoryIcon(iconKey?: string | null): LucideIcon {
  if (!iconKey) return HardHat
  return ICON_MAP[iconKey] ?? HardHat
}

export function resolveCategoryIconColor(slug?: string | null): {
  bg: string
  fg: string
  ring: string
} {
  if (!slug) return DEFAULT_COLOR
  return COLOR_BY_SLUG[slug] ?? DEFAULT_COLOR
}
