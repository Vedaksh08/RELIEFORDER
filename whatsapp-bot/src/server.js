import 'dotenv/config'
import express from 'express'
import { initClient, enqueue, state, getClient } from './client.js'
import { customerMessage, adminMessage, toChatId } from './messages.js'
import { getSettings, saveSettings } from './settings.js'

const app = express()
app.use(express.json({ limit: '256kb' }))

// The admin panel runs on a different origin (Vercel), so it needs CORS.
// Only the configured origins may call this service.
const ALLOWED = (process.env.ALLOWED_ORIGINS ?? '*')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

app.use((req, res, next) => {
  const origin = req.get('origin')
  if (ALLOWED.includes('*')) res.set('Access-Control-Allow-Origin', '*')
  else if (origin && ALLOWED.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin)
    res.set('Vary', 'Origin')
  }
  res.set('Access-Control-Allow-Headers', 'content-type, x-bot-secret')
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

const PORT = process.env.PORT ?? 8080
const SECRET = process.env.BOT_SECRET
// Admin numbers, customer statuses and the kill switch all live in
// settings.js so the admin panel can change them at runtime.

if (!SECRET) {
  console.error('FATAL: BOT_SECRET is not set. Refusing to start.')
  process.exit(1)
}

/** Shared-secret guard. The web app calls this only from a server context. */
function auth(req, res, next) {
  const given = req.get('x-bot-secret')
  // constant-ish comparison; lengths differ rarely enough to not leak much
  if (!given || given !== SECRET) {
    return res.status(401).json({ error: 'unauthorized' })
  }
  next()
}

// ---------------------------------------------------------------------------
// QR login page — protected, because whoever scans it controls the number.
// Visit /qr?secret=YOUR_BOT_SECRET
// ---------------------------------------------------------------------------
app.get('/qr', (req, res) => {
  if (req.query.secret !== SECRET) return res.status(401).send('unauthorized')

  if (state.ready) {
    return res.send(
      `<body style="font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0;background:#e2f7f2">
         <div style="text-align:center">
           <h2 style="color:#2e3192">WhatsApp connected</h2>
           <p style="color:#123040">Logged in as <b>${state.me ?? 'unknown'}</b></p>
         </div>
       </body>`,
    )
  }
  if (!state.qr) {
    return res.send(
      `<body style="font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0;background:#e2f7f2">
         <div style="text-align:center">
           <h2 style="color:#2e3192">Starting…</h2>
           <p style="color:#123040">No QR yet. This page refreshes automatically.</p>
         </div>
         <script>setTimeout(()=>location.reload(),3000)</script>
       </body>`,
    )
  }
  res.send(
    `<body style="font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0;background:#e2f7f2">
       <div style="text-align:center">
         <h2 style="color:#2e3192">Scan with the bot's WhatsApp</h2>
         <img src="${state.qr}" width="300" height="300" alt="QR code" />
         <p style="color:#123040;max-width:340px">
           WhatsApp → Settings → Linked devices → Link a device
         </p>
       </div>
       <script>setTimeout(()=>location.reload(),20000)</script>
     </body>`,
  )
})

app.get('/health', (_req, res) => {
  const cfg = getSettings()
  res.json({
    ready: state.ready,
    me: state.me,
    queued: state.queueLength,
    sentLastHour: state.sentTimestamps.length,
    sendingEnabled: cfg.sendingEnabled,
    lastError: state.lastError,
  })
})

// ---------------------------------------------------------------------------
// JSON status + QR for the admin panel. Secret-guarded like everything else.
// ---------------------------------------------------------------------------
app.get('/status', auth, (_req, res) => {
  const cfg = getSettings()
  res.json({
    ready: state.ready,
    me: state.me,
    qr: state.qr, // data-URL, null once linked
    queued: state.queueLength,
    sentLastHour: state.sentTimestamps.length,
    lastError: state.lastError,
    settings: cfg,
  })
})

app.get('/settings', auth, (_req, res) => res.json(getSettings()))

app.post('/settings', auth, (req, res) => {
  const { adminNumbers, customerStatuses, sendingEnabled } = req.body ?? {}
  const patch = {}

  if (Array.isArray(adminNumbers)) {
    // keep only numbers WhatsApp could actually route to
    patch.adminNumbers = adminNumbers
      .map((n) => String(n).trim())
      .filter((n) => toChatId(n))
  }
  if (Array.isArray(customerStatuses)) {
    const allowed = ['placed', 'accepted', 'dispatched', 'delivered', 'rejected']
    patch.customerStatuses = customerStatuses.filter((x) => allowed.includes(x))
  }
  if (typeof sendingEnabled === 'boolean') patch.sendingEnabled = sendingEnabled

  res.json(saveSettings(patch))
})

/** Unlink the current number so a different one can be scanned. */
app.post('/logout', auth, async (_req, res) => {
  try {
    await getClient()?.logout()
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: String(e.message ?? e) })
  }
})

// ---------------------------------------------------------------------------
// POST /notify  — the only endpoint the web app calls.
// { status, order: { id, total, mobile, address, note, customer_name,
//                    order_items: [{name, brand, qty}] } }
// ---------------------------------------------------------------------------
app.post('/notify', auth, async (req, res) => {
  const { status, order } = req.body ?? {}
  if (!status || !order) {
    return res.status(400).json({ error: 'status and order are required' })
  }
  const cfg = getSettings()
  if (!cfg.sendingEnabled) {
    return res.json({ skipped: 'sending disabled' })
  }

  const results = { customer: 'skipped', admins: [] }

  // ---- customer ----
  if (cfg.customerStatuses.includes(status)) {
    const body = customerMessage(status, order)
    const chatId = toChatId(order.mobile)
    if (!body) results.customer = 'no template'
    else if (!chatId) results.customer = 'invalid mobile'
    else {
      // queued, not awaited: the queue paces sends and the admin panel
      // should never block on WhatsApp delivery
      enqueue(chatId, body, `customer:${status}`).catch((e) =>
        console.error('[notify] customer send failed', e.message),
      )
      results.customer = 'queued'
    }
  }

  // ---- admins (receive only, and only for brand new orders) ----
  if (status === 'placed' && cfg.adminNumbers.length) {
    const body = adminMessage(order)
    for (const n of cfg.adminNumbers) {
      const chatId = toChatId(n)
      if (!chatId) {
        results.admins.push({ number: n, status: 'invalid' })
        continue
      }
      enqueue(chatId, body, 'admin:new-order').catch((e) =>
        console.error('[notify] admin send failed', e.message),
      )
      results.admins.push({ number: n, status: 'queued' })
    }
  }

  res.json({ ok: true, ...results })
})

/** Manual send, handy for testing: { to, body } */
app.post('/send', auth, async (req, res) => {
  const { to, body } = req.body ?? {}
  if (!to || !body) return res.status(400).json({ error: 'to and body required' })
  if (!getSettings().sendingEnabled) return res.json({ skipped: 'sending disabled' })

  const chatId = toChatId(to)
  if (!chatId) return res.status(400).json({ error: 'invalid number' })

  try {
    await enqueue(chatId, body, 'manual')
    res.json({ ok: true })
  } catch (e) {
    res.status(502).json({ error: String(e.message ?? e) })
  }
})

initClient()

app.listen(PORT, () => {
  const cfg = getSettings()
  console.log(`[bot] listening on :${PORT}`)
  console.log(`[bot] QR page: /qr?secret=<BOT_SECRET> (or scan from the admin panel)`)
  console.log(`[bot] customer statuses: ${cfg.customerStatuses.join(', ') || '(none)'}`)
  console.log(`[bot] admin numbers: ${cfg.adminNumbers.length}`)
  if (!cfg.sendingEnabled) console.warn('[bot] SENDING IS CURRENTLY DISABLED')
})
