/**
 * Squash leftover Tailwind radii in page content.
 * Header/Footer stay untouched — they keep their own chrome.
 *
 * Covers:
 * - arbitrary: rounded-[22px], sm:rounded-t-[20px], …
 * - named: rounded-xl / 2xl / 3xl / lg / md (+ directional)
 *
 * Keeps rounded-full (avatars/dots) and rounded-none / rounded-sm.
 *
 * Run: node scripts/square-cabinet-radii.mjs
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const root = process.cwd()
const SKIP = new Set(
  ['src/components/Header.tsx', 'src/components/Footer.tsx'].map((p) => p.split('/').join(sep)),
)

const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.(tsx|ts|jsx|js|css)$/.test(entry) && !entry.endsWith('.d.ts')) out.push(full)
  }
  return out
}

/** rounded-[22px], rounded-t-[26px], sm:rounded-[20px], hover:rounded-b-[12px] … */
const ARBITRARY =
  /(?<=^|["'`\s])((?:[a-z-]+:)*)rounded(-(?:t|b|l|r|tl|tr|bl|br|s|e|ss|se|ee|es))?-\[([^\]]+)\]/g

/** rounded-xl / 2xl / 3xl / lg / md (+ sides), with optional variants */
const NAMED =
  /(?<=^|["'`\s])((?:[a-z-]+:)*)rounded(-(?:t|b|l|r|tl|tr|bl|br|s|e|ss|se|ee|es))?-(xl|2xl|3xl|lg|md)(?=$|["'`\s])/g

let files = 0
let hits = 0

for (const file of walk(join(root, 'src'))) {
  const rel = relative(root, file)
  if (SKIP.has(rel)) continue
  // Keep index.css token/header locks; radii there are handled manually.
  if (rel === join('src', 'index.css')) continue

  const before = readFileSync(file, 'utf8')
  let after = before.replace(ARBITRARY, (_m, variants, side) => {
    hits += 1
    return `${variants}rounded${side || ''}-none`
  })
  after = after.replace(NAMED, (_m, variants, side) => {
    hits += 1
    return `${variants}rounded${side || ''}-none`
  })
  if (after !== before) {
    writeFileSync(file, after)
    files += 1
  }
}

console.log(`squared ${hits} radii across ${files} files`)
