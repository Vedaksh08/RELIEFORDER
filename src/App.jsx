import { useCallback, useEffect, useState } from 'react'
import { Download, Globe, CreditCard, MessageCircle } from 'lucide-react'
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
            <DesignerCredit />
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

/* Footer credit — tapping reveals quick links to reach the designer. */
const DESIGNER = {
  whatsapp: 'https://wa.me/919764112680',
  website: 'https://vedantkshirsagar.netlify.app/',
  card: 'https://vedantdigicard.vercel.app/',
}

function DesignerCredit() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative flex flex-col items-center">
      {open && (
        <div
          className="absolute bottom-full mb-2 flex gap-2"
          style={{ animation: 'toast-in 0.3s cubic-bezier(0.22,1,0.36,1) both' }}
        >
          <CreditLink href={DESIGNER.website} icon={Globe} label="Website" />
          <CreditLink href={DESIGNER.card} icon={CreditCard} label="My Card" />
          <CreditLink href={DESIGNER.whatsapp} icon={MessageCircle} label="WhatsApp" />
        </div>
      )}
      <p className="flex items-center gap-1.5 text-center text-[10.5px] font-medium text-muted">
        <span>Designed by Vedant K.</span>
        <button
          onClick={() => setOpen((o) => !o)}
          className="font-semibold text-[#0A66D6] underline decoration-dotted underline-offset-2 hover:text-[#2E3192]"
        >
          Click here to contact
        </button>
      </p>
    </div>
  )
}

function CreditLink({ href, icon: Icon, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#0A66D6]/25 bg-white/95 px-3 py-1.5 text-[10.5px] font-bold text-[#123040] shadow-md backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <Icon size={12} className="text-[#0A66D6]" />
      {label}
    </a>
  )
}
