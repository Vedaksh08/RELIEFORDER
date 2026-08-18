// Client for the whatsapp-bot service.
//
// NOTE ON THE SECRET: VITE_ vars are baked into the browser bundle, so the
// value below is readable by anyone who opens the site. That is acceptable
// only because the bot must never be exposed publicly — keep it on a private
// network/tunnel, or put a stricter proxy in front. If the bot is reachable
// from the open internet, move these calls into a Supabase Edge Function and
// keep the secret server-side.

const BASE = (import.meta.env.VITE_BOT_URL ?? '').replace(/\/$/, '')
const SECRET = import.meta.env.VITE_BOT_SECRET ?? ''

export const botConfigured = Boolean(BASE && SECRET)

async function call(path, { method = 'GET', body } = {}) {
  if (!botConfigured) throw new Error('Bot URL or secret is not configured')

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'x-bot-secret': SECRET,
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Bot returned ${res.status}`)
  }
  return res.json()
}

export const getBotStatus = () => call('/status')
export const saveBotSettings = (patch) =>
  call('/settings', { method: 'POST', body: patch })
export const botLogout = () => call('/logout', { method: 'POST' })
export const sendTest = (to, body) =>
  call('/send', { method: 'POST', body: { to, body } })

/**
 * Fire-and-forget order notification. Never blocks or breaks the admin flow:
 * WhatsApp is a nice-to-have, the order status change is what matters.
 */
export function notifyOrder(status, order) {
  if (!botConfigured) return
  call('/notify', { method: 'POST', body: { status, order } }).catch((e) =>
    console.warn('[bot] notify failed:', e.message),
  )
}
