import { useState } from 'react'
import {
  UserPlus,
  Copy,
  Check,
  ChevronDown,
  Pill,
  Cross,
  HeartPulse,
  Baby,
  Sparkles,
  Truck,
  Stethoscope,
} from 'lucide-react'
import RippleButton from './RippleButton.jsx'
import SectionDivider from './SectionDivider.jsx'
import Gallery from './Gallery.jsx'
import { BUSINESS, CONTACT, SERVICES, buildVCard, buildContactText } from '../data/siteData.js'

const SERVICE_ICONS = {
  pill: Pill,
  cross: Cross,
  heart: HeartPulse,
  baby: Baby,
  sparkles: Sparkles,
  truck: Truck,
}

export default function FrontCard({ onFlip, onLogoClick }) {
  const [copied, setCopied] = useState(false)

  const saveContact = () => {
    const blob = new Blob([buildVCard()], { type: 'text/vcard;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Relief-Medical-General-Store.vcf'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const copyContact = async () => {
    try {
      await navigator.clipboard.writeText(buildContactText())
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard blocked */
    }
  }

  const stop = (e) => e.stopPropagation()

  return (
    <div
      onClick={onFlip}
      className="glass-strong relative flex h-full cursor-pointer select-none flex-col overflow-hidden rounded-[2rem] px-6 pb-5 pt-7"
    >
      {/* soft brand glows */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-sky-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-60 w-60 rounded-full bg-emerald-300/20 blur-3xl" />

      {/* ---------- HERO HEADER ---------- */}
      <header className="relative flex flex-col items-center px-2 pb-1 pt-1 text-center text-white">
        <button
          onClick={(e) => {
            stop(e)
            onLogoClick()
          }}
          aria-label="View logo"
          className="logo-glow relative transition-transform hover:scale-105 active:scale-95"
        >
          <span className="pulse-ring absolute inset-0 rounded-3xl bg-primary-2/25" />
          <div className="logo-surface relative grid h-20 w-20 place-items-center overflow-hidden rounded-3xl p-2 shadow-lg ring-1 ring-black/5">
            <img
              src={BUSINESS.logo}
              alt={`${BUSINESS.fullName} logo`}
              className="h-full w-full object-contain"
            />
          </div>
        </button>

        <h1
          className="font-display mt-4 font-bold leading-tight tracking-tight text-white drop-shadow-sm"
          style={{ fontSize: 'clamp(1.4rem, 7.4vw, 1.9rem)' }}
        >
          {BUSINESS.name}
        </h1>
        <p className="font-display text-[15px] font-semibold tracking-wide text-sky-200">
          {BUSINESS.nameSuffix}
        </p>

        {/* elegant divider + tagline */}
        <div className="mt-2.5 flex items-center gap-2.5">
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-emerald-200/85" />
          <span className="whitespace-nowrap text-[9.5px] font-semibold uppercase tracking-[0.15em] text-emerald-200">
            {BUSINESS.tagline}
          </span>
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-emerald-200/85" />
        </div>

        <p className="mt-2.5 max-w-[19rem] text-[11.5px] font-medium leading-relaxed text-white/85">
          {BUSINESS.blurb}
        </p>
      </header>

      {/* ---------- SERVICES ---------- */}
      <section className="section-surface relative mt-4" onClick={stop}>
        <SectionDivider icon={Stethoscope}>Our Services</SectionDivider>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          {SERVICES.map((s) => {
            const Icon = SERVICE_ICONS[s.icon] ?? Cross
            return (
              <div
                key={s.label}
                className="glass service-chip flex items-center gap-2 rounded-xl px-2.5 py-2"
              >
                <span className="service-icon">
                  <Icon size={14} strokeWidth={2.2} />
                </span>
                <span className="text-[10.5px] font-semibold leading-tight text-[#12305E]">
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* ---------- STORE GALLERY (auto-hides while no photos) ---------- */}
      <Gallery className="mt-4" onClick={stop} />

      {/* ---------- FREE DELIVERY CTA ---------- */}
      <div className="relative my-auto py-4" onClick={stop}>
        <RippleButton
          as="a"
          href={CONTACT.whatsappText}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-accent flex w-full items-center justify-center gap-3 rounded-2xl px-4 py-3"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/20 ring-1 ring-white/40">
            <Truck size={18} />
          </span>
          <span className="text-left">
            <span className="block text-[13px] font-bold leading-tight">Free Home Delivery</span>
            <span className="block text-[10.5px] font-medium text-white/85">
              Order on WhatsApp — quick doorstep service
            </span>
          </span>
        </RippleButton>
      </div>

      {/* ---------- MAIN ACTIONS ---------- */}
      <section className="grid grid-cols-2 gap-3" onClick={stop}>
        <ActionButton icon={UserPlus} label="Save Contact" onClick={saveContact} variant="primary" />
        <ActionButton
          icon={copied ? Check : Copy}
          label={copied ? 'Copied!' : 'Copy Contact'}
          onClick={copyContact}
          variant="secondary"
        />
      </section>

      {/* ---------- FLIP HINT ---------- */}
      <div className="mt-3.5 flex flex-col items-center gap-0.5 text-white/70">
        <span className="text-[8px] font-bold uppercase tracking-[0.28em]">Tap Card to Flip</span>
        <ChevronDown size={13} className="bounce-arrow" />
      </div>
    </div>
  )
}

function ActionButton({ icon: Icon, label, variant, ...rest }) {
  const cls = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    accent: 'btn-accent',
    whatsapp: 'btn-whatsapp',
  }
  return (
    <RippleButton
      className={`${cls[variant]} flex items-center justify-center gap-2 py-3.5 text-[13px] font-semibold`}
      {...rest}
    >
      <Icon size={16} />
      {label}
    </RippleButton>
  )
}
