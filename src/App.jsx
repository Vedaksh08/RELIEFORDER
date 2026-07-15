import { useCallback, useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import Background from './components/Background.jsx'
import SplashScreen from './components/SplashScreen.jsx'
import FlipCard, { CARD_WIDTH, CARD_HEIGHT } from './components/FlipCard.jsx'
import InstallModal from './components/InstallModal.jsx'
import { ToastProvider, useToast } from './components/Toast.jsx'
import usePWA from './hooks/usePWA.js'
import { BUSINESS } from './data/siteData.js'

// vertical room kept for the install banner, footer line and breathing space
const RESERVED_Y = 118

/** Uniform scale so the fixed-size card always fits the viewport — no scrolling. */
function useCardScale() {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const compute = () => {
      const vw = window.innerWidth
      const vh = window.visualViewport?.height ?? window.innerHeight
      const s = Math.min((vw - 20) / CARD_WIDTH, (vh - RESERVED_Y) / CARD_HEIGHT, 1)
      setScale(Math.max(s, 0.4))
    }
    compute()
    window.addEventListener('resize', compute)
    window.visualViewport?.addEventListener('resize', compute)
    return () => {
      window.removeEventListener('resize', compute)
      window.visualViewport?.removeEventListener('resize', compute)
    }
  }, [])
  return scale
}

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
  const scale = useCardScale()

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

      <main className="relative mx-auto flex h-[100dvh] w-full flex-col items-center justify-center overflow-hidden px-2 pb-2 pt-12">
        {phase === 'splash' && <SplashScreen onDone={finishSplash} />}

        {phase === 'card' && (
          <div className="flex w-full flex-col items-center gap-2">
            {/* fixed-design card, scaled uniformly to always fit on screen */}
            <div style={{ width: CARD_WIDTH * scale, height: CARD_HEIGHT * scale }}>
              <div
                style={{
                  width: CARD_WIDTH,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                }}
              >
                <FlipCard onInstall={handleInstallClick} installed={pwa.installed} />
              </div>
            </div>
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
