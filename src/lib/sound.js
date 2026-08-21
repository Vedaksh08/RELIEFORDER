// Notification sound. Uses /public/notification.mp3, precached by the PWA
// service worker so it also plays offline.

const SRC = '/notification.mp3'

let primed = false
const pool = []

function make() {
  const a = new Audio(SRC)
  a.preload = 'auto'
  a.volume = 0.85
  // Tells the browser this is ongoing playback rather than a one-off blip,
  // which stops some engines from tearing it down in a background tab.
  a.loop = false
  return a
}

/**
 * Browsers block programmatic playback until the user has interacted with the
 * page. Call this from a real click/tap so later chimes (e.g. a realtime
 * "new order" event) are allowed to play — including while the tab is in the
 * background, which is the case that matters for an order alert.
 */
export function primeAudio() {
  if (primed) return
  primed = true

  // Pre-build the pool so a later background chime never has to construct
  // and load an element while the tab is throttled.
  for (let i = 0; i < 3; i++) {
    const a = make()
    a.volume = 0
    a.play()
      .then(() => {
        a.pause()
        a.currentTime = 0
        a.volume = 0.85
        pool.push(a)
      })
      .catch(() => {}) // still blocked — playChime retries on the next gesture
  }

  // A silent looping audio element keeps the tab's media session alive, so
  // Chrome does not suspend playback capability while it is backgrounded.
  keepAlive()
}

let keeper = null
function keepAlive() {
  if (keeper) return
  try {
    // 1 sample of silence, looped. Inaudible, but it holds the audio
    // pipeline open so a later chime is not swallowed in a background tab.
    keeper = new Audio(
      'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=',
    )
    keeper.loop = true
    keeper.volume = 0.0001
    keeper.play().catch(() => {
      keeper = null
    })
  } catch {
    keeper = null
  }
}

function play(volume = 0.85) {
  // reuse an idle element so rapid-fire events can overlap
  let a = pool.find((el) => el.paused || el.ended)
  if (!a) {
    a = make()
    if (pool.length < 4) pool.push(a)
  }
  try {
    a.currentTime = 0
  } catch {
    // some browsers throw if the element is not ready yet
  }
  a.volume = volume
  const p = a.play()
  if (p?.catch) p.catch(() => {}) // autoplay blocked — ignore rather than throw
}

/** New order placed / received. */
export const playChime = () => play(0.9)

/** Softer confirmation for accept / dispatch / deliver. */
export const playConfirm = () => play(0.5)

/** Same sound at low volume for errors — distinct without a second asset. */
export const playError = () => play(0.35)

/** Stops the silent keep-alive track. Call on sign-out or teardown. */
export function releaseAudio() {
  if (keeper) {
    keeper.pause()
    keeper = null
  }
}
