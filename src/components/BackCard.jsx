import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import {
  Phone,
  PhoneCall,
  MessageCircle,
  Mail,
  MapPin,
  Navigation,
  Clock,
  Star,
  ExternalLink,
  ShieldCheck,
  Users,
  Tags,
  Share2,
  Download,
  RotateCcw,
  Link2,
  Check,
  X,
  IndianRupee,
} from 'lucide-react'
import RippleButton from './RippleButton.jsx'
import SectionDivider from './SectionDivider.jsx'
import BrandMarquee from './BrandMarquee.jsx'
import TrustRotator from './TrustRotator.jsx'
import {
  BUSINESS,
  OWNER,
  CONTACT,
  LOCATION,
  TIMINGS,
  REVIEWS,
  UPI_QR,
  TRUST_TITLE,
} from '../data/siteData.js'

export default function BackCard({ onFlip, onLogoClick, onInstall, installed }) {
  const shareUrl = typeof window !== 'undefined' ? window.location.href : BUSINESS.shareUrl
  const stop = (e) => e.stopPropagation()

  return (
    <div
      onClick={onFlip}
      className="glass-strong relative flex h-full cursor-pointer select-none flex-col overflow-hidden rounded-[2rem] px-6 pb-5 pt-6 text-ink"
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary-2/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-60 w-60 rounded-full bg-accent/10 blur-3xl" />

      {/* ---------- HEADER ---------- */}
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">
            {BUSINESS.fullName}
          </p>
          <h2 className="font-display text-2xl font-bold leading-tight text-ink">Get in Touch</h2>
          <span className="mt-1.5 block h-[2px] w-14 rounded-full bg-gradient-to-r from-sky-400 via-emerald-300 to-transparent" />
        </div>
        <button
          onClick={(e) => {
            stop(e)
            onLogoClick()
          }}
          aria-label="View logo"
          className="logo-glow logo-surface relative grid h-12 w-12 place-items-center overflow-hidden rounded-xl p-1 shadow-md ring-1 ring-emerald-300/30"
        >
          <img src={BUSINESS.logo} alt={BUSINESS.fullName} className="h-full w-full object-contain" />
        </button>
      </div>

      {/* ---------- 1 · CONTACT DETAILS ---------- */}
      <section className="section-surface relative mt-3.5" onClick={stop}>
        <SectionDivider icon={Users}>Contact Details</SectionDivider>

        {/* owner card — call + whatsapp orbs */}
        <div className="glass mt-2.5 flex w-full min-w-0 items-center gap-2.5 rounded-2xl p-2.5">
          {OWNER.photo ? (
            <img
              src={OWNER.photo}
              alt={OWNER.name}
              className="h-11 w-11 shrink-0 rounded-full object-cover shadow-md ring-2 ring-emerald-300/45 ring-offset-1 ring-offset-white"
            />
          ) : (
            <div
              className="font-display grid h-11 w-11 shrink-0 place-items-center rounded-full text-[14px] font-bold text-white shadow-md ring-2 ring-emerald-300/45 ring-offset-1 ring-offset-white"
              style={{ background: 'linear-gradient(135deg,#1E3A8A,#2563EB,#10B981)' }}
            >
              {OWNER.initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-bold leading-tight text-[#12305E]">
              {OWNER.name}
            </p>
            <p className="truncate text-[9.5px] font-bold uppercase tracking-[0.08em] text-emerald-700">
              {OWNER.role}
            </p>
            <p className="mt-0.5 flex items-center gap-1 truncate text-[11.5px] font-medium text-[#48618C]">
              <Phone size={11} className="shrink-0 text-[#2563EB]" />
              <span className="truncate">{CONTACT.phone}</span>
            </p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <RippleButton
              as="a"
              href={CONTACT.tel}
              aria-label={`Call ${OWNER.name}`}
              className="btn-primary btn-orb h-10 w-10"
            >
              <Phone size={16} />
            </RippleButton>
            <RippleButton
              as="a"
              href={CONTACT.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`WhatsApp ${OWNER.name}`}
              className="btn-whatsapp btn-orb h-10 w-10"
            >
              <MessageCircle size={16} />
            </RippleButton>
          </div>
        </div>

        {/* secondary phone + email */}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <ContactChip
            href={CONTACT.telSecondary}
            icon={PhoneCall}
            label="Secondary"
            value={CONTACT.phoneSecondary}
          />
          <ContactChip href={CONTACT.mailto} icon={Mail} label="Email" value="Write to us" />
        </div>

        {/* store timings — auto-hides while unset */}
        {TIMINGS && (
          <div className="glass mt-2 flex items-center gap-2.5 rounded-xl px-3 py-2">
            <span className="service-icon">
              <Clock size={14} strokeWidth={2.2} />
            </span>
            <span className="text-[11px] font-semibold text-[#12305E]">
              {TIMINGS.days} · {TIMINGS.hours}
            </span>
          </div>
        )}

        {/* address + maps */}
        <div className="glass mt-2 flex items-center gap-2.5 rounded-2xl p-2.5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#10B981] text-white shadow-sm ring-1 ring-emerald-300/30">
            <MapPin size={17} />
          </div>
          <p className="min-w-0 flex-1 text-[10.5px] font-semibold leading-snug text-[#12305E]">
            {LOCATION.lines.join(', ')}
          </p>
          <RippleButton
            as="a"
            href={LOCATION.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-accent flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-2 text-[10px] font-bold"
          >
            <Navigation size={11} /> Maps
          </RippleButton>
        </div>
      </section>

      {/* ---------- 2 · BRAND CAROUSEL ---------- */}
      <section className="section-surface relative mt-3.5" onClick={stop}>
        <SectionDivider icon={Tags}>Brands Available</SectionDivider>
        <div className="mt-2">
          <BrandMarquee />
        </div>
      </section>

      {/* ---------- 3 · GOOGLE REVIEWS ---------- */}
      <section className="section-surface relative mt-3.5" onClick={stop}>
        <SectionDivider icon={Star}>{REVIEWS.title}</SectionDivider>
        <div className="glass mt-2.5 rounded-2xl p-3.5">
          <div className="flex items-center justify-center gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star
                key={i}
                size={17}
                className="star-pop fill-amber-400 text-amber-400"
                style={{ animationDelay: `${i * 0.09}s` }}
              />
            ))}
          </div>
          <p className="mt-2 text-center text-[11px] font-medium leading-relaxed text-[#48618C]">
            {REVIEWS.line}
          </p>
          {REVIEWS.qr && (
            <img
              src={REVIEWS.qr}
              alt="Google review QR code"
              loading="lazy"
              className="mx-auto mt-2.5 h-24 w-24 rounded-lg object-contain"
            />
          )}
          <RippleButton
            as="a"
            href={REVIEWS.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-3 flex w-full items-center justify-center gap-1.5 py-2.5 text-[12px] font-semibold"
          >
            <Star size={14} /> Leave us a Google Review <ExternalLink size={12} />
          </RippleButton>
        </div>
      </section>

      {/* ---------- 4 · TRUST SECTION ---------- */}
      <section className="section-surface relative mt-3.5">
        <SectionDivider icon={ShieldCheck}>{TRUST_TITLE}</SectionDivider>
        <TrustRotator className="mt-2.5" />
      </section>

      {/* ---------- 5 · BOTTOM ACTIONS (right aligned) ---------- */}
      <BottomActions
        shareUrl={shareUrl}
        stop={stop}
        onInstall={onInstall}
        installed={installed}
      />

      {/* flip hint */}
      <div className="relative mt-auto flex items-center justify-center gap-1.5 pt-3 text-muted/70">
        <RotateCcw size={11} />
        <span className="text-[8px] font-bold uppercase tracking-[0.28em]">Tap Card to Flip Back</span>
      </div>
    </div>
  )
}

/* ---------------- pieces ---------------- */

function ContactChip({ href, icon: Icon, label, value }) {
  return (
    <RippleButton
      as="a"
      href={href}
      className="glass flex items-center gap-2 rounded-xl px-2.5 py-2 text-left"
    >
      <span className="service-icon">
        <Icon size={13} strokeWidth={2.2} />
      </span>
      <span className="min-w-0">
        <span className="block text-[8.5px] font-bold uppercase tracking-[0.14em] text-emerald-700">
          {label}
        </span>
        <span className="block truncate text-[11px] font-semibold text-[#12305E]">{value}</span>
      </span>
    </RippleButton>
  )
}

function BottomActions({ shareUrl, stop, onInstall, installed }) {
  const [shareOpen, setShareOpen] = useState(false)
  const [upiOpen, setUpiOpen] = useState(false)

  return (
    <>
      <div
        className={`relative mt-4 grid gap-3 ${UPI_QR ? 'grid-cols-3' : installed ? 'grid-cols-1' : 'grid-cols-2'}`}
        onClick={stop}
      >
        {UPI_QR && (
          <RippleButton
            onClick={() => setUpiOpen(true)}
            className="btn-secondary flex items-center justify-center gap-1.5 py-3 text-[12.5px] font-semibold"
          >
            <IndianRupee size={15} /> UPI
          </RippleButton>
        )}
        <RippleButton
          onClick={() => setShareOpen(true)}
          className="btn-secondary flex items-center justify-center gap-2 py-3 text-[12.5px] font-semibold"
        >
          <Share2 size={15} /> Share This Card
        </RippleButton>
        {!installed && (
          <RippleButton
            onClick={onInstall}
            className="btn-accent flex items-center justify-center gap-2 py-3 text-[12.5px] font-semibold"
          >
            <Download size={15} /> Install Card
          </RippleButton>
        )}
      </div>

      {shareOpen && <SharePopup shareUrl={shareUrl} onClose={() => setShareOpen(false)} />}
      {upiOpen && UPI_QR && (
        <QrPopup
          title="Pay via UPI"
          subtitle="Scan with any UPI app"
          image={UPI_QR}
          onClose={() => setUpiOpen(false)}
        />
      )}
    </>
  )
}

function SharePopup({ shareUrl, onClose }) {
  const [copied, setCopied] = useState(false)
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* blocked */
    }
  }

  const nativeShare = async () => {
    try {
      await navigator.share({
        title: BUSINESS.fullName,
        text: `${BUSINESS.fullName} — ${BUSINESS.tagline}`,
        url: shareUrl,
      })
    } catch {
      /* user cancelled */
    }
  }

  return (
    <div
      className="modal-overlay fixed inset-0 z-[120] flex items-center justify-center p-6"
      onClick={(e) => {
        e.stopPropagation()
        onClose()
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        aria-label="Close"
        className="modal-close modal-close-pin btn grid h-10 w-10 place-items-center rounded-full text-white"
      >
        <X size={20} />
      </button>
      <div
        className="flex w-full max-w-xs flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'logo-popup 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
      >
        <div className="relative">
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-primary via-primary-2 to-accent opacity-55 blur-md" />
          <div className="glass logo-surface relative rounded-3xl p-4 shadow-2xl">
            <QRCodeSVG
              value={shareUrl}
              size={200}
              level="M"
              fgColor="#0A1F52"
              bgColor="#ffffff"
              imageSettings={{ src: BUSINESS.logo, height: 42, width: 42, excavate: true }}
            />
          </div>
        </div>
        <p className="text-sm font-semibold text-white drop-shadow">Scan to open this card</p>
        <div className="grid w-full grid-cols-2 gap-2.5">
          {canNativeShare && (
            <RippleButton
              onClick={nativeShare}
              className="btn-accent flex items-center justify-center gap-1.5 py-3 text-[12.5px] font-semibold"
            >
              <Share2 size={15} /> Share
            </RippleButton>
          )}
          <RippleButton
            onClick={copyLink}
            className={`btn-secondary flex items-center justify-center gap-1.5 py-3 text-[12.5px] font-semibold ${
              canNativeShare ? '' : 'col-span-2'
            }`}
          >
            {copied ? <Check size={15} /> : <Link2 size={15} />}
            {copied ? 'Copied' : 'Copy Link'}
          </RippleButton>
        </div>
      </div>
    </div>
  )
}

function QrPopup({ title, subtitle, image, onClose }) {
  return (
    <div
      className="modal-overlay fixed inset-0 z-[120] flex items-center justify-center p-6"
      onClick={(e) => {
        e.stopPropagation()
        onClose()
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        aria-label="Close"
        className="modal-close modal-close-pin btn grid h-10 w-10 place-items-center rounded-full text-white"
      >
        <X size={20} />
      </button>
      <div
        className="flex flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'logo-popup 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
      >
        <div className="glass logo-surface rounded-3xl p-4 shadow-2xl">
          <img src={image} alt={title} className="h-52 w-52 rounded-xl object-contain" />
        </div>
        <p className="text-sm font-semibold text-white drop-shadow">{title}</p>
        <p className="text-xs text-white/75">{subtitle}</p>
      </div>
    </div>
  )
}
