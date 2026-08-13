/** Smoke: client problemGuideEngine intent routing for cost/docs/electrician. */
function wantsCostEstimate(text) {
  return /(кошторис|оцінк\w*\s+варт|скільки\s*(це\s*)?кошт|калькулятор\s*варт|зроби(ти)?\s*коштор|estimate|cost\s*estim|budget\s*estim|how\s*much\s*(will\s*it\s*)?cost)/i.test(text)
}
function classifyDocuments(text) {
  return /(документ|договор|договір|ліценз)/i.test(text)
}
function extractCity(text) {
  const m = text.match(/\b(Darmstadt|Alicante|Kyiv|Madrid)\b/i)
  return m ? m[1] : null
}
function extractElectrician(text) {
  return /(електрик|electrician)/i.test(text)
}
function extractBathroomArea(text) {
  const m = text.match(/(\d+)\s*м²|(\d+)\s*m²|(\d+)\s*sqm/i)
  return m ? Number(m[1] || m[2] || m[3]) : null
}

const cases = [
  {
    name: 'electrician Darmstadt',
    text: 'Мені потрібен електрик у Darmstadt',
    expect: () => extractElectrician('Мені потрібен електрик у Darmstadt') && extractCity('Мені потрібен електрик у Darmstadt') === 'Darmstadt',
  },
  {
    name: 'bathroom Alicante 8m2',
    text: 'Хочу ремонт ванної 8 м² в Alicante',
    expect: () => extractCity('Хочу ремонт ванної 8 м² в Alicante') === 'Alicante' && extractBathroomArea('Хочу ремонт ванної 8 м² в Alicante') === 8,
  },
  {
    name: 'cost → calculator',
    text: 'Скільки коштує ремонт?',
    expect: () => wantsCostEstimate('Скільки коштує ремонт?'),
  },
  {
    name: 'contract → documents',
    text: 'Мені потрібен договір ремонту',
    expect: () => classifyDocuments('Мені потрібен договір ремонту'),
  },
]

let failed = 0
for (const c of cases) {
  const ok = c.expect()
  console.log(ok ? 'ok' : 'FAIL', c.name)
  if (!ok) failed++
}
process.exit(failed ? 1 : 0)
