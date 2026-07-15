import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import FrontCard from './FrontCard.jsx'
import BackCard from './BackCard.jsx'
import { BUSINESS } from '../data/siteData.js'

// Fixed design size — the card always lays out at exactly this size and
// App scales it uniformly to fit the viewport (no scrolling, ever).
export const CARD_WIDTH = 408
export const CARD_HEIGHT = 880

export default function FlipCard({ onInstall, installed }) {
  const [flipped, setFlipped] = useState(false)
  const [logoOpen, setLogoOpen] = useState(false)

  return (
    <>
      <div className="perspective-card w-full">
        <div
          className={`flip-inner ${flipped ? 'is-flipped' : ''}`}
          style={{ height: CARD_HEIGHT }}
        >
          <div className="flip-face front">
            <FrontCard
              onFlip={() => setFlipped(true)}
              onLogoClick={() => setLogoOpen(true)}
            />
          </div>
          <div className="flip-face back">
            <BackCard
              onFlip={() => setFlipped(false)}
              onLogoClick={() => setLogoOpen(true)}
              onInstall={onInstall}
              installed={installed}
            />
          </div>
        </div>
      </div>

      {logoOpen && <LogoPopup onClose={() => setLogoOpen(false)} />}
    </>
  )
}

function LogoPopup({ onClose }) {
  // portaled to <body> — the card lives inside a scaled container, and a
  // transform would otherwise trap this fixed overlay inside the card box
  return createPortal(
    <div
      className="modal-overlay fixed inset-0 z-[100] flex items-center justify-center p-6"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="btn modal-close-pin grid h-11 w-11 place-items-center rounded-full bg-white text-[#12305E] shadow-lg ring-1 ring-black/10 hover:bg-emerald-400 hover:text-white"
      >
        <X size={20} />
      </button>
      <div
        className="flex flex-col items-center gap-5"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'logo-popup 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
      >
        <div className="logo-surface grid h-56 w-56 place-items-center overflow-hidden rounded-[2rem] p-4 shadow-2xl ring-1 ring-black/5">
          <img src={BUSINESS.logo} alt={BUSINESS.fullName} className="h-full w-full object-contain" />
        </div>
        <div className="text-center">
          <p className="font-display text-xl font-bold text-white drop-shadow">{BUSINESS.fullName}</p>
          <p className="mt-1 text-sm font-medium text-emerald-300">{BUSINESS.tagline}</p>
        </div>
      </div>
    </div>,
    document.body
  )
}
