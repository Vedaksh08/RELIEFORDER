import fs from 'node:fs'
import path from 'node:path'

// Settings edited from the admin panel are persisted to disk so they survive
// restarts. Env vars act only as the initial seed.
const FILE = process.env.SETTINGS_PATH ?? './.bot-settings.json'

const seedAdmins = (process.env.ADMIN_NUMBERS ?? '')
  .split(',')
  .map((n) => n.trim())
  .filter(Boolean)

const seedStatuses = (
  process.env.CUSTOMER_STATUSES ?? 'placed,accepted,dispatched,delivered'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const DEFAULTS = {
  adminNumbers: seedAdmins,
  customerStatuses: seedStatuses,
  sendingEnabled: process.env.SENDING_ENABLED !== 'false',
}

let cache = null

export function getSettings() {
  if (cache) return cache
  try {
    const raw = fs.readFileSync(FILE, 'utf8')
    cache = { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    cache = { ...DEFAULTS } // first run, or unreadable file
  }
  return cache
}

export function saveSettings(patch) {
  const next = { ...getSettings(), ...patch }
  cache = next
  try {
    fs.mkdirSync(path.dirname(path.resolve(FILE)), { recursive: true })
    fs.writeFileSync(FILE, JSON.stringify(next, null, 2), 'utf8')
  } catch (e) {
    console.error('[settings] could not persist:', e.message)
  }
  return next
}
