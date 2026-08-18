// Notification sound. Uses /public/notification.mp3, precached by the PWA
// service worker so it also plays offline.

const SRC = '/notification.mp3'

let primed = false
const pool = []

function make() {
  const a = new Audio(SRC)
  a.preload = 'auto'
  a.volume = 0.85
  return a
}

/**
 * Browsers block programmatic playback until the user has interacted with the
 * page. Call this from a real click/tap so later chimes (e.g. a realtime
 * "new order" event) are allowed to play.
 */
export function primeAudio() {
  if (primed) return
  primed = true
  const a = make()
  a.volume = 0
  a.play()
    .then(() => {
      a.pause()
      a.currentTime = 0
      a.volume = 0.85
      pool.push(a)
    })
    .catch(() => {}) // still blocked — playChime will retry on the next gesture
}

function play(volume = 0.85) {
  // reuse an idle element so rapid-fire events can overlap
  let a = pool.find((el) => el.paused || el.ended)
  if (!a) {
    a = make()
    if (pool.length < 4) pool.push(a)
  }
  a.currentTime = 0
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
