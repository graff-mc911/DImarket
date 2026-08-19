/**
 * CSP Report-Only collector.
 * Browsers POST violations here; nothing is blocked.
 * Logs a short summary to Vercel function logs — no PII store.
 */
const MAX_BYTES = 32_000

function summarize(entry) {
  const body = entry?.body && typeof entry.body === 'object' ? entry.body : entry
  const report = body?.['csp-report'] && typeof body['csp-report'] === 'object' ? body['csp-report'] : body
  const directive =
    report?.['effective-directive'] ||
    report?.['violated-directive'] ||
    report?.effectiveDirective ||
    entry?.type ||
    ''
  const blocked = String(report?.['blocked-uri'] || report?.blockedURL || report?.blockedUri || '').slice(0, 220)
  const document = String(report?.['document-uri'] || report?.documentURL || report?.documentUri || '').slice(0, 220)
  return { directive, blocked, document }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    res.status(204).end()
    return
  }

  try {
    let raw = ''
    if (typeof req.body === 'string') {
      raw = req.body
    } else if (req.body && typeof req.body === 'object') {
      console.info('[csp-report]', JSON.stringify(summarize(req.body)))
      res.status(204).end()
      return
    } else if (req[Symbol.asyncIterator]) {
      const chunks = []
      let size = 0
      for await (const chunk of req) {
        size += chunk.length
        if (size > MAX_BYTES) break
        chunks.push(chunk)
      }
      raw = Buffer.concat(chunks).toString('utf8')
    }

    if (raw) {
      const parsed = JSON.parse(raw)
      const list = Array.isArray(parsed) ? parsed : [parsed]
      for (const item of list.slice(0, 20)) {
        console.info('[csp-report]', JSON.stringify(summarize(item)))
      }
    }
  } catch {
    // Malformed reports are dropped.
  }

  res.status(204).end()
}
