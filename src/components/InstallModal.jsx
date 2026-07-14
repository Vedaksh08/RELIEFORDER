import { useEffect } from 'react'
import { X, Download, Share as ShareIcon, Plus, Smartphone } from 'lucide-react'
import RippleButton from './RippleButton.jsx'
import { BUSINESS } from '../data/siteData.js'

/**
 * First-visit / on-demand install modal (mirrors the reference card).
 *  - Android/desktop Chromium: primary button fires the native prompt.
 *  - iOS Safari (no native API): shows "Add to Home Screen" steps.
 */
export default function InstallModal({ isIosSafari, canInstall, onInstall, onDismiss }) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && onDismiss()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onDismiss])

  const install = async () => {
    if (!canInstall) return // iOS — instructions stay visible
    await onInstall()
  }

  return (
    <div
      className="modal-overlay fixed inset-0 z-[130] flex items-end justify-center p-0 sm:items-center sm:p-4"
      onClick={onDismiss}
      role="dialog"
      aria-modal="true"
      aria-label="Install this card"
    >
      <div
        className="modal-panel glass-strong relative w-full overflow-hidden rounded-t-[2rem] text-ink sm:max-w-sm sm:rounded-[2rem]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onDismiss}
          aria-label="Close"
          className="modal-close modal-close-pin btn grid h-10 w-10 place-items-center rounded-full text-white"
        >
          <X size={19} />
        </button>

        <div className="stagger flex flex-col items-center px-6 pb-6 pt-8 text-center">
          <div className="relative mb-4">
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-primary via-primary-2 to-accent opacity-60 blur-md" />
            <div className="logo-surface relative grid h-16 w-16 place-items-center overflow-hidden rounded-2xl p-1.5 shadow-lg ring-1 ring-black/5">
              <img src={BUSINESS.logo} alt={BUSINESS.fullName} className="h-full w-full object-contain" />
            </div>
          </div>

          <h2 className="font-display text-xl font-bold text-ink">
            📲 Save this Digital Business Card
          </h2>
          <p className="mt-2 max-w-[20rem] text-[13px] leading-relaxed text-muted">
            Keep {BUSINESS.fullName} one tap away. Save it to your Home Screen for
            quick orders and faster home delivery.
          </p>

          {/* iOS instructions */}
          {isIosSafari && !canInstall && (
            <div className="mt-5 w-full rounded-2xl border border-primary/10 bg-primary/5 p-4 text-left">
              <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-muted">How to install</p>
              <ol className="flex flex-col gap-3 text-[13px] text-ink/90">
                <li className="flex items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary-2 text-white">
                    <ShareIcon size={16} />
                  </span>
                  <span>
                    Tap the <span className="font-semibold">Share</span> button
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary-2 text-white">
                    <Plus size={16} />
                  </span>
                  <span>
                    Tap <span className="font-semibold">“Add to Home Screen”</span>
                  </span>
                </li>
              </ol>
            </div>
          )}

          <div className="mt-6 flex w-full flex-col gap-2.5">
            {!isIosSafari && (
              <RippleButton
                onClick={install}
                className="btn-accent flex w-full items-center justify-center gap-2 py-3.5 text-sm font-bold"
              >
                <Download size={18} /> Add to Home Screen
              </RippleButton>
            )}
            <RippleButton
              onClick={onDismiss}
              className="btn-secondary flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold"
            >
              Maybe Later
            </RippleButton>
            {!isIosSafari && !canInstall && (
              <p className="mt-1 flex items-center justify-center gap-1.5 text-[11px] text-muted">
                <Smartphone size={12} /> Use your browser menu → “Install app / Add to Home Screen”.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
