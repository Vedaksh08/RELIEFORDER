import { useCallback, useEffect, useRef, useState } from 'react'

/* ============================================================
   PWA install logic — mirrors the reference card exactly.
   - `installed` is TRUE only when running standalone (real app),
     never from a stored flag, so the button reappears in a normal
     browser tab and only disappears inside the installed app.
   - Dismissal memory (7 days) only gates the auto-opening modal.
   ============================================================ */

const DISMISS_KEY = 'pwa-install-dismissed-at'
const DISMISS_DAYS = 7

const isBrowser = () => typeof window !== 'undefined'

export function isStandalone() {
  if (!isBrowser()) return false
  const modes = ['standalone', 'fullscreen', 'minimal-ui']
  const matchesDisplay = modes.some((m) => window.matchMedia(`(display-mode: ${m})`).matches)
  const iosStandalone = 'standalone' in window.navigator && window.navigator.standalone === true
  return matchesDisplay || iosStandalone
}

export function isIos() {
  if (!isBrowser()) return false
  const ua = window.navigator.userAgent
  const iOSDevice = /iPad|iPhone|iPod/.test(ua)
  const iPadOS = window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1
  return iOSDevice || iPadOS
}

export function isSafari() {
  if (!isBrowser()) return false
  const ua = window.navigator.userAgent
  return /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(ua)
}

function rememberDismissal() {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(DISMISS_KEY, Date.now().toString())
  } catch {
    /* private mode — ignore */
  }
}

function clearDismissal() {
  if (!isBrowser()) return
  try {
    window.localStorage.removeItem(DISMISS_KEY)
  } catch {
    /* ignore */
  }
}

function dismissalExpired() {
  if (!isBrowser()) return true
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY)
    if (!raw) return true
    const at = Number(raw)
    if (!Number.isFinite(at)) return true
    return Date.now() - at > DISMISS_DAYS * 24 * 60 * 60 * 1000
  } catch {
    return true
  }
}

/**
 * Central PWA install state + actions.
 * `installed` reflects standalone only (accurate — matches the reference).
 */
export default function usePWA() {
  const deferredPrompt = useRef(null)
  const [installed, setInstalled] = useState(false)
  const [canInstall, setCanInstall] = useState(false)
  const [isIosSafari, setIsIosSafari] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true)
      return
    }
    setIsIosSafari(isIos() && isSafari())

    const onBeforeInstall = (e) => {
      e.preventDefault()
      deferredPrompt.current = e
      setCanInstall(true)
    }
    const onInstalled = () => {
      setInstalled(true)
      setCanInstall(false)
      deferredPrompt.current = null
      clearDismissal()
      setShowModal(false)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  // Auto-open the first-visit modal after a short delay (unless dismissed <7d ago).
  useEffect(() => {
    if (installed) return
    if (!dismissalExpired()) return
    const t = setTimeout(() => setShowModal(true), 2000)
    return () => clearTimeout(t)
  }, [installed])

  const promptInstall = useCallback(async () => {
    const prompt = deferredPrompt.current
    if (!prompt) return false
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    deferredPrompt.current = null
    setCanInstall(false)
    if (outcome === 'accepted') {
      clearDismissal()
      setShowModal(false)
      return true
    }
    return false
  }, [])

  const openModal = useCallback(() => setShowModal(true), [])
  const dismissModal = useCallback(() => {
    rememberDismissal()
    setShowModal(false)
  }, [])

  return {
    installed,
    canInstall,
    isIosSafari,
    showModal,
    promptInstall,
    openModal,
    dismissModal,
  }
}
