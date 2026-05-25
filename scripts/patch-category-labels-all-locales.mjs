import fs from 'fs'
import path from 'path'

const dir = 'src/lib/Translations'
const enPatch = {
  "'category.electrical': 'Electrical'": "'category.electrical': 'Auto repair shop'",
  "'category.electrical': 'Elektryka'": "'category.electrical': 'Auto repair shop'",
  "'category.electricalDesc': 'Electrical work and repairs'": "'category.electricalDesc': 'Car service station and auto repair'",
  "'category.tools': 'Tools'": "'category.tools': 'Transport & Delivery'",
  "'category.toolsDesc': 'Tools and equipment'": "'category.toolsDesc': 'Freight transport and material delivery'",
  "'category.name.electrical': 'Electrical'": "'category.name.electrical': 'Auto repair shop'",
  "'category.name.tools': 'Tools'": "'category.name.tools': 'Transport & Delivery'",
}

const files = fs.readdirSync(dir).filter((f) => f.endsWith('.ts') && f !== 'en.ts' && f !== 'uk.ts' && f !== 'ru.ts')

for (const file of files) {
  const fp = path.join(dir, file)
  let text = fs.readFileSync(fp, 'utf8')
  let changed = false
  for (const [from, to] of Object.entries(enPatch)) {
    if (text.includes(from)) {
      text = text.split(from).join(to)
      changed = true
    }
  }
  // Fallback: regex replace common patterns
  const pairs = [
    [/('category\.name\.electrical': ')[^']+(')/, "$1Auto repair shop$2"],
    [/('category\.electrical': ')[^']+(')/, "$1Auto repair shop$2"],
    [/('category\.name\.tools': ')[^']+(')/, "$1Transport & Delivery$2"],
    [/('category\.tools': ')[^']+(')/, "$1Transport & Delivery$2"],
  ]
  for (const [re, rep] of pairs) {
    const next = text.replace(re, rep)
    if (next !== text) {
      text = next
      changed = true
    }
  }
  if (changed) {
    fs.writeFileSync(fp, text)
    console.log('patched', file)
  }
}

console.log('done')
