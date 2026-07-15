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
  ShieldCheck,
  BadgeCheck,
  ArrowRight,
} from 'lucide-react'
import RippleButton from './RippleButton.jsx'
import SectionDivider from './SectionDivider.jsx'
import Rotator from './Rotator.jsx'
import {
  BUSINESS,
  CONTACT,
  SERVICES,
  TRUST_TITLE,
  TRUST_LINES,
  buildVCard,
  buildContactText,
} from '../data/siteData.js'

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
      className="glass-strong relative flex h-full cursor-pointer select-none flex-col overflow-hidden rounded-[2rem] px-6 pb-5 pt-6"
    >
      {/* soft brand glows */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-200/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-60 w-60 rounded-full bg-emerald-300/20 blur-3xl" />

      {/* ---------- HERO HEADER ---------- */}
      <header
        className="rise relative flex flex-col items-center px-2 pb-1 pt-1 text-center text-white"
        style={{ animationDelay: '0.05s' }}
      >
        <button
          onClick={(e) => {
            stop(e)
            onLogoClick()
          }}
          aria-label="View logo"
          className="logo-glow logo-float relative transition-transform hover:scale-105 active:scale-95"
        >
          <span className="pulse-ring absolute inset-0 rounded-[1.5rem] bg-white/20" />
          <div className="logo-surface relative grid h-21 w-21 place-items-center overflow-hidden rounded-[1.5rem] p-2 shadow-xl ring-1 ring-black/5">
            <img
              src={BUSINESS.logo}
              alt={`${BUSINESS.fullName} logo`}
              className="h-full w-full object-contain"
            />
          </div>
        </button>

        <h1
          className="font-display mt-4 font-bold leading-tight tracking-tight text-white drop-shadow-sm"
          style={{ fontSize: 'clamp(1.5rem, 7.6vw, 1.95rem)' }}
        >
          {BUSINESS.name}
        </h1>
        <p className="font-display mt-0.5 text-[15px] font-semibold tracking-wide text-cyan-100">
          {BUSINESS.nameSuffix}
        </p>

        {/* elegant divider + tagline */}
        <div className="mt-2.5 flex items-center gap-2.5">
          <span className="h-px w-9 bg-gradient-to-r from-transparent to-white/70" />
          <span className="whitespace-nowrap text-[9.5px] font-semibold uppercase tracking-[0.16em] text-emerald-100">
            {BUSINESS.tagline}
          </span>
          <span className="h-px w-9 bg-gradient-to-l from-transparent to-white/70" />
        </div>

        <p className="mt-2.5 max-w-[19.5rem] text-[11.5px] font-medium leading-relaxed text-white/85">
          {BUSINESS.blurb}
        </p>
      </header>

      {/* ---------- SERVICES ---------- */}
      <section className="section-surface rise relative mt-4" style={{ animationDelay: '0.16s' }}>
        <SectionDivider icon={Stethoscope}>Our Services</SectionDivider>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          {SERVICES.map((s) => {
            const Icon = SERVICE_ICONS[s.icon] ?? Cross
            return (
              <div
                key={s.label}
                className="glass service-chip flex items-center gap-2.5 rounded-2xl px-3 py-2"
              >
                <span className="service-icon">
                  <Icon size={15} strokeWidth={2.2} />
                </span>
                <span className="text-[10.5px] font-semibold leading-tight text-[#123040]">
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* ---------- FREE DELIVERY CTA ---------- */}
      <div className="rise relative mt-3.5" style={{ animationDelay: '0.27s' }}>
        <RippleButton
          as="a"
          href={CONTACT.whatsappText}
          target="_blank"
          rel="noopener noreferrer"
          className="delivery-cta flex w-full items-center gap-3 rounded-2xl px-4 py-2.5"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/22 ring-1 ring-white/50">
            <Truck size={19} />
          </span>
          <span className="min-w-0 flex-1 text-left text-white">
            <span className="block text-[13.5px] font-bold leading-tight drop-shadow-sm">
              Free Home Delivery
            </span>
            <span className="mt-0.5 block truncate text-[10.5px] font-medium text-white/90">
              Order on WhatsApp — quick service
            </span>
          </span>
          <ArrowRight size={17} className="shrink-0 text-white/85" />
        </RippleButton>
      </div>

      {/* ---------- WHY CUSTOMERS TRUST US ---------- */}
      <section className="section-surface rise relative mt-3.5" style={{ animationDelay: '0.36s' }}>
        <SectionDivider icon={ShieldCheck}>{TRUST_TITLE}</SectionDivider>
        <div className="glass mt-2.5 flex items-center gap-2.5 rounded-2xl px-3 py-2">
          <span className="service-icon">
            <BadgeCheck size={15} strokeWidth={2.2} />
          </span>
          <Rotator
            lines={TRUST_LINES}
            interval={3000}
            className="min-h-[2rem] flex-1 justify-start"
            textClassName="font-display text-left text-[12.5px] font-semibold leading-snug text-[#123040]"
          />
        </div>
      </section>

      {/* ---------- MAIN ACTIONS ---------- */}
      <section className="rise mt-auto grid grid-cols-2 gap-3 pt-3" style={{ animationDelay: '0.45s' }}>
        <ActionButton icon={UserPlus} label="Save Contact" onClick={saveContact} variant="primary" />
        <ActionButton
          icon={copied ? Check : Copy}
          label={copied ? 'Copied!' : 'Copy Contact'}
          onClick={copyContact}
          variant="secondary"
        />
      </section>

      {/* ---------- FLIP HINT ---------- */}
      <div className="mt-3 flex flex-col items-center gap-0.5 text-white/70">
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
