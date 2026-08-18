import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { registerSW } from 'virtual:pwa-register'
import { router } from './router.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)

// Service worker: offline support + installability. Auto-updates in the
// background; the new version activates on the next load.
//
// In dev we do the opposite: a service worker left over from a production
// build keeps serving stale JS, which silently breaks env-dependent code
// (e.g. the WhatsApp bot URL reads as empty). Tear it down instead.
if (import.meta.env.DEV) {
  navigator.serviceWorker?.getRegistrations?.().then((regs) => {
    regs.forEach((r) => r.unregister())
    if (regs.length) {
      caches?.keys?.().then((keys) => keys.forEach((k) => caches.delete(k)))
      console.info('[dev] removed %d stale service worker(s) — reloading', regs.length)
      location.reload()
    }
  })
} else {
  registerSW({ immediate: true })
}
