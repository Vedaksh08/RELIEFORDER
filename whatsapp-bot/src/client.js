import pkg from 'whatsapp-web.js'
import qrTerminal from 'qrcode-terminal'
import QRCode from 'qrcode'

const { Client, LocalAuth } = pkg

// ---------------------------------------------------------------------------
// Rate limiting. Blasting messages back-to-back is the fastest way to get a
// number flagged, so every send goes through a queue with a randomised gap
// and an hourly cap.
// ---------------------------------------------------------------------------
const MIN_GAP_MS = Number(process.env.MIN_GAP_MS ?? 8000)
const MAX_GAP_MS = Number(process.env.MAX_GAP_MS ?? 20000)
const MAX_PER_HOUR = Number(process.env.MAX_PER_HOUR ?? 40)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const jitter = () => MIN_GAP_MS + Math.random() * (MAX_GAP_MS - MIN_GAP_MS)

export const state = {
  ready: false,
  qr: null, // data-URL for the QR page
  me: null,
  lastError: null,
  sentTimestamps: [], // rolling window for the hourly cap
  queueLength: 0,
}

let client = null
const queue = []
let draining = false

export function initClient() {
  client = new Client({
    authStrategy: new LocalAuth({
      // persisted so a restart does not need a fresh QR scan
      dataPath: process.env.SESSION_PATH ?? './.wwebjs_auth',
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        // NOTE: --single-process is deliberately absent. It saves memory on
        // small containers but makes Chromium drop frames mid-navigation on
        // Windows ("Navigating frame was detached"), so WhatsApp Web never
        // finishes loading and no QR is ever produced.
      ],
      // WhatsApp Web can be slow on first load; the 30s default aborts it.
      timeout: 120000,
    },
  })

  client.on('qr', async (qr) => {
    state.ready = false
    qrTerminal.generate(qr, { small: true })
    state.qr = await QRCode.toDataURL(qr)
    console.log('[wa] QR ready — scan it from the bot number')
  })

  client.on('authenticated', () => console.log('[wa] authenticated'))

  client.on('ready', async () => {
    state.ready = true
    state.qr = null
    state.me = client.info?.wid?.user ?? null
    console.log(`[wa] ready as ${state.me}`)
  })

  client.on('auth_failure', (m) => {
    state.ready = false
    state.lastError = `auth_failure: ${m}`
    console.error('[wa] auth failure', m)
  })

  client.on('disconnected', async (reason) => {
    state.ready = false
    state.lastError = `disconnected: ${reason}`
    console.error('[wa] disconnected:', reason)
    // A logout needs a new QR; transient drops usually recover on re-init.
    try {
      await client.destroy()
    } catch {}
    setTimeout(() => client.initialize().catch(console.error), 5000)
  })

  client.initialize().catch((e) => {
    state.lastError = String(e)
    console.error('[wa] initialize failed', e)
  })

  return client
}

// Liveness probe: getState() throws if the page is gone. Without this the
// bot reports ready:true after a silent crash and only reveals the problem
// when a real order fails to send.
setInterval(async () => {
  if (!state.ready || restarting) return
  try {
    await client.getState()
  } catch (e) {
    if (isDeadSession(e)) restartClient('liveness probe failed')
  }
}, 60_000)

/**
 * Puppeteer errors that mean the underlying browser/page is gone. When these
 * happen whatsapp-web.js does NOT emit 'disconnected', so state.ready stays
 * true and every later send fails with the same message until the process is
 * restarted by hand.
 */
function isDeadSession(e) {
  const m = String(e?.message ?? e)
  return (
    m.includes('detached Frame') ||
    m.includes('Session closed') ||
    m.includes('Target closed') ||
    m.includes('Protocol error') ||
    m.includes('Execution context was destroyed') ||
    m.includes('Navigating frame was detached')
  )
}

let restarting = false

/** Rebuild the client in place. The saved session means no new QR scan. */
async function restartClient(reason) {
  if (restarting) return
  restarting = true
  state.ready = false
  state.lastError = `recovering: ${reason}`
  console.warn(`[wa] session died (${reason}) — restarting client`)

  try {
    await client?.destroy()
  } catch {
    // already gone; nothing to clean up
  }

  await sleep(2000)
  try {
    initClient() // re-creates `client` and re-attaches every handler
    console.log('[wa] client re-initialised')
  } catch (e) {
    state.lastError = `restart failed: ${e.message}`
    console.error('[wa] restart failed', e)
  } finally {
    restarting = false
  }
}

function underHourlyCap() {
  const cutoff = Date.now() - 3600_000
  state.sentTimestamps = state.sentTimestamps.filter((t) => t > cutoff)
  return state.sentTimestamps.length < MAX_PER_HOUR
}

async function drain() {
  if (draining) return
  draining = true

  while (queue.length) {
    state.queueLength = queue.length

    if (!state.ready) {
      // hold the queue rather than dropping messages
      await sleep(5000)
      continue
    }
    if (!underHourlyCap()) {
      console.warn('[wa] hourly cap reached — pausing 5 min')
      await sleep(300_000)
      continue
    }

    const job = queue.shift()
    try {
      // Only send to numbers that actually have WhatsApp; sending to
      // unregistered numbers repeatedly is itself a spam signal.
      const registered = await client.isRegisteredUser(job.chatId)
      if (!registered) {
        console.warn(`[wa] not on WhatsApp: ${job.chatId}`)
        job.reject?.(new Error('not a WhatsApp user'))
      } else {
        await client.sendMessage(job.chatId, job.body)
        state.sentTimestamps.push(Date.now())
        console.log(`[wa] sent -> ${job.chatId} (${job.kind ?? 'message'})`)
        job.resolve?.()
      }
    } catch (e) {
      console.error('[wa] send failed', e)
      state.lastError = String(e)

      if (isDeadSession(e)) {
        // Not this message's fault — the browser died. Put it back at the
        // front and rebuild the client; the loop pauses on !state.ready
        // until the session is live again.
        queue.unshift(job)
        state.queueLength = queue.length
        restartClient(e.message ?? 'unknown')
        await sleep(8000)
        continue
      }

      job.reject?.(e)
    }

    if (queue.length) await sleep(jitter())
  }

  state.queueLength = 0
  draining = false
}

/** Queues a message. Resolves when it is actually sent, not when queued. */
export function enqueue(chatId, body, kind) {
  return new Promise((resolve, reject) => {
    queue.push({ chatId, body, kind, resolve, reject })
    state.queueLength = queue.length
    drain()
  })
}

export const getClient = () => client
