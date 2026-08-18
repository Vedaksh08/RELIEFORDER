// Desktop / mobile push-style notifications for the admin panel.
// Uses the Notification API directly (no server, no push subscription):
// alerts fire while the admin tab is open, including in the background.

const KEY = 'relief_admin_notify'

export const notificationsSupported = () =>
  typeof window !== 'undefined' && 'Notification' in window

/** Browser-level permission: 'granted' | 'denied' | 'default' | 'unsupported' */
export const permission = () =>
  notificationsSupported() ? Notification.permission : 'unsupported'

/** The admin's own on/off switch, independent of browser permission. */
export const alertsEnabled = () =>
  localStorage.getItem(KEY) === '1' && permission() === 'granted'

export function setAlertsEnabled(on) {
  localStorage.setItem(KEY, on ? '1' : '0')
}

/**
 * Asks the browser for permission. Must be called from a user gesture —
 * browsers ignore (or auto-deny) requests that come from a timer or a
 * background event.
 * @returns {Promise<'granted'|'denied'|'default'|'unsupported'>}
 */
export async function requestPermission() {
  if (!notificationsSupported()) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

/**
 * Shows a notification. Prefers the service worker registration so it still
 * appears when the tab is backgrounded on Android; falls back to a plain
 * Notification on desktop.
 */
export async function notify(title, { body, tag, onClick } = {}) {
  if (!alertsEnabled()) return

  const options = {
    body,
    tag, // same tag replaces rather than stacks duplicates
    icon: '/icons/favicon-48.png',
    badge: '/icons/favicon-48.png',
    renotify: Boolean(tag),
    requireInteraction: false,
  }

  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg?.showNotification) {
      await reg.showNotification(title, options)
      return
    }
  } catch {
    // fall through to the direct API
  }

  try {
    const n = new Notification(title, options)
    if (onClick) {
      n.onclick = () => {
        window.focus()
        onClick()
        n.close()
      }
    }
  } catch {
    // some browsers throw if the page is not visible — safe to ignore
  }
}
