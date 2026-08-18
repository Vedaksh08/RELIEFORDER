// Minimal CSV helpers — handles quoted fields, embedded commas and newlines.

export function toCSV(rows) {
  const cols = ['name', 'brand', 'category', 'price', 'stock']
  const esc = (v) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [
    cols.join(','),
    ...rows.map((r) => cols.map((c) => esc(r[c])).join(',')),
  ].join('\n')
}

export function parseCSV(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else quoted = false
      } else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += c
  }
  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }

  const nonEmpty = rows.filter((r) => r.some((c) => c.trim() !== ''))
  if (nonEmpty.length === 0) return []

  const header = nonEmpty[0].map((h) => h.trim().toLowerCase())
  return nonEmpty.slice(1).map((r) => {
    const o = {}
    header.forEach((h, i) => (o[h] = (r[i] ?? '').trim()))
    return o
  })
}

/**
 * Builds a preview of what an import would change — nothing is written until
 * the admin confirms. Matching is by (name + brand), case-insensitive.
 */
export function diffImport(parsed, existing) {
  const key = (n, b) => `${(n ?? '').toLowerCase()}|${(b ?? '').toLowerCase()}`
  const byKey = new Map(existing.map((m) => [key(m.name, m.brand), m]))

  const creates = []
  const updates = []
  const errors = []

  parsed.forEach((r, idx) => {
    const name = r.name
    if (!name) {
      errors.push(`Row ${idx + 2}: missing name`)
      return
    }
    const price = r.price === '' || r.price == null ? null : Number(r.price)
    const stock = r.stock === '' || r.stock == null ? null : Number(r.stock)
    if (price != null && (Number.isNaN(price) || price < 0)) {
      errors.push(`Row ${idx + 2}: bad price "${r.price}"`)
      return
    }
    if (stock != null && (!Number.isInteger(stock) || stock < 0)) {
      errors.push(`Row ${idx + 2}: bad stock "${r.stock}"`)
      return
    }

    const found = byKey.get(key(name, r.brand))
    const next = {
      name,
      brand: r.brand || null,
      category: r.category || null,
      price: price ?? 0,
      stock: stock ?? 0,
    }

    if (!found) creates.push(next)
    else {
      const changed =
        Number(found.price) !== next.price ||
        Number(found.stock) !== next.stock ||
        (found.category ?? null) !== next.category
      if (changed) updates.push({ ...next, id: found.id, before: found })
    }
  })

  return { creates, updates, errors }
}
