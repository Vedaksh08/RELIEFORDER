import { useCallback, useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import Background from './components/Background.jsx'
import SplashScreen from './components/SplashScreen.jsx'
import FlipCard from './components/FlipCard.jsx'
import InstallModal from './components/InstallModal.jsx'
import { ToastProvider, useToast } from './components/Toast.jsx'
import usePWA from './hooks/usePWA.js'
import { BUSINESS } from './data/siteData.js'

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  )
}

function AppInner() {
  const [phase, setPhase] = useState('splash') // 'splash' | 'card'

  const pwa = usePWA()
  const toast = useToast()

  useEffect(() => {
    if (sessionStorage.getItem('rm_seen')) setPhase('card')
  }, [])

  const finishSplash = () => {
    try {
      sessionStorage.setItem('rm_seen', '1')
    } catch {
      /* ignore */
    }
    setPhase('card')
  }

  // The card's "Install" button — native prompt, iOS steps, or a hint toast.
  const handleInstallClick = useCallback(async () => {
    if (pwa.canInstall) {
      const accepted = await pwa.promptInstall()
      if (!accepted) toast('Installation cancelled')
      return
    }
    if (pwa.isIosSafari) {
      pwa.openModal() // show the "Add to Home Screen" steps
      return
    }
    toast('Open in Chrome or Safari to install this card')
  }, [pwa, toast])

  return (
    <>
      <Background />

      {/* slim always-on install hint — gone once the app is installed */}
      {phase === 'card' && !pwa.installed && (
        <button onClick={handleInstallClick} className="install-banner" aria-label="Install this card">
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#22C55E] to-[#1F8A46] text-white">
            <Download size={11} strokeWidth={2.5} />
          </span>
          Add this card to your Home Screen for 1-tap access
        </button>
      )}

      <main className="relative mx-auto flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-y-auto px-4 pb-6 pt-14 sm:pb-8 [@media(max-height:880px)]:justify-start">
        {phase === 'splash' && <SplashScreen onDone={finishSplash} />}

        {phase === 'card' && (
          <div className="flex w-full flex-col items-center gap-4">
            <FlipCard onInstall={handleInstallClick} installed={pwa.installed} />
            <p className="flex items-center gap-2 text-center text-[11px] font-medium text-muted">
              <span>© {new Date().getFullYear()} {BUSINESS.fullName}</span>
              <span className="text-accent">•</span>
              <span>Nigdi, Pune</span>
            </p>
          </div>
        )}
      </main>

      {/* First-visit / iOS install modal — never shown once installed */}
      {pwa.showModal && !pwa.installed && (
        <InstallModal
          isIosSafari={pwa.isIosSafari}
          canInstall={pwa.canInstall}
          onInstall={pwa.promptInstall}
          onDismiss={pwa.dismissModal}
        />
      )}
    </>
  )
}
