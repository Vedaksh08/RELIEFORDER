import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Navigation,
  Star,
  ExternalLink,
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
import Rotator from './Rotator.jsx'
import {
  BUSINESS,
  CONTACT,
  LOCATION,
  REVIEWS,
  UPI_QR,
} from '../data/siteData.js'

export default function BackCard({ onFlip, onLogoClick, onInstall, installed }) {
  const shareUrl = typeof window !== 'undefined' ? window.location.href : BUSINESS.shareUrl
  const stop = (e) => e.stopPropagation()

  return (
    <div
      onClick={onFlip}
      className="glass-strong relative flex h-full cursor-pointer select-none flex-col overflow-hidden rounded-[2rem] px-6 pb-5 pt-6 text-white"
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-200/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-60 w-60 rounded-full bg-emerald-300/20 blur-3xl" />

      {/* ---------- HEADER ---------- */}
      <div className="rise relative flex items-center justify-between" style={{ animationDelay: '0.05s' }}>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-100">
            {BUSINESS.fullName}
          </p>
          <h2 className="font-display text-2xl font-bold leading-tight text-white">Get in Touch</h2>
          <span className="mt-1.5 block h-[2px] w-14 rounded-full bg-gradient-to-r from-white/80 via-cyan-200/70 to-transparent" />
        </div>
        <button
          onClick={(e) => {
            stop(e)
            onLogoClick()
          }}
          aria-label="View logo"
          className="logo-glow logo-surface relative grid h-12 w-12 place-items-center overflow-hidden rounded-xl p-1 shadow-md ring-1 ring-white/40"
        >
          <img src={BUSINESS.logo} alt={BUSINESS.fullName} className="h-full w-full object-contain" />
        </button>
      </div>

      {/* ---------- 1 · CONTACT DETAILS ---------- */}
      <section className="section-surface rise relative mt-auto pt-2" style={{ animationDelay: '0.12s' }}>
        <SectionDivider icon={Users}>Contact Details</SectionDivider>

        {/* store contact card — call + whatsapp orbs */}
        <div className="glass mt-3 flex w-full min-w-0 items-center gap-3 rounded-2xl p-3">
          <div className="logo-surface grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full p-1 shadow-md ring-2 ring-emerald-500/35 ring-offset-1 ring-offset-white">
            <img src={BUSINESS.logo} alt={BUSINESS.fullName} className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold uppercase leading-tight text-[#123040]">
              {BUSINESS.name}
            </p>
            <p className="mt-1 whitespace-nowrap pr-1 text-[14px] font-bold tracking-tight text-[#123040]">
              <span>{CONTACT.phone}</span>
            </p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <RippleButton
              as="a"
              href={CONTACT.tel}
              aria-label={`Call ${BUSINESS.fullName}`}
              className="btn-blue btn-orb h-9 w-9"
            >
              <Phone size={15} />
            </RippleButton>
            <RippleButton
              as="a"
              href={CONTACT.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`WhatsApp ${BUSINESS.fullName}`}
              className="btn-whatsapp btn-orb h-9 w-9"
            >
              <MessageCircle size={15} />
            </RippleButton>
          </div>
        </div>

        {/* email */}
        <div className="mt-2.5">
          <ContactChip href={CONTACT.mailto} icon={Mail} label="Email" value={CONTACT.email} />
        </div>

        {/* address + maps */}
        <div className="glass mt-2.5 flex items-center gap-3 rounded-2xl p-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#2E3192] to-[#0A66D6] text-white shadow-sm ring-1 ring-white/40">
            <MapPin size={17} />
          </div>
          <p className="min-w-0 flex-1 text-[10.5px] font-semibold leading-snug text-[#123040]">
            {LOCATION.lines.join(', ')}
          </p>
          <RippleButton
            as="a"
            href={LOCATION.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-accent flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-[10.5px] font-bold"
          >
            <Navigation size={12} /> Maps
          </RippleButton>
        </div>
      </section>

      {/* ---------- 2 · BRAND CAROUSEL ---------- */}
      <section className="section-surface rise relative mt-auto pt-2" style={{ animationDelay: '0.19s' }}>
        <SectionDivider icon={Tags}>Brands Available</SectionDivider>
        <div className="mt-2">
          <BrandMarquee />
        </div>
      </section>

      {/* ---------- 3 · CUSTOMER REVIEWS (rotating real quotes) ---------- */}
      <section className="section-surface rise relative mt-auto pt-2" style={{ animationDelay: '0.26s' }}>
        <SectionDivider icon={Star}>{REVIEWS.title}</SectionDivider>
        <div className="glass mt-3 rounded-2xl px-4 py-4">
          <div className="flex items-center justify-center gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star
                key={i}
                size={18}
                className="star-pop fill-amber-400 text-amber-400 drop-shadow-sm"
                style={{ animationDelay: `${0.3 + i * 0.09}s` }}
              />
            ))}
          </div>
          <Rotator
            lines={REVIEWS.items}
            interval={3500}
            className="mt-2.5 min-h-[4.25rem] justify-center"
            textClassName="font-display text-center text-[12px] font-medium italic leading-relaxed text-[#123040]"
          />
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
            className="btn-blue mt-3 flex w-full items-center justify-center gap-1.5 py-2.5 text-[12px] font-semibold"
          >
            <Star size={14} /> Leave us a Google Review <ExternalLink size={12} />
          </RippleButton>
        </div>
      </section>

      {/* ---------- 4 · BOTTOM ACTIONS ---------- */}
      <BottomActions
        shareUrl={shareUrl}
        onInstall={onInstall}
        installed={installed}
      />

      {/* flip hint */}
      <div className="relative flex items-center justify-center gap-1.5 pt-3.5 text-white/70">
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
      className="glass flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left"
    >
      <span className="service-icon">
        <Icon size={14} strokeWidth={2.2} />
      </span>
      <span className="min-w-0">
        <span className="block text-[8.5px] font-bold uppercase tracking-[0.14em] text-emerald-700">
          {label}
        </span>
        <span className="block truncate text-[11px] font-semibold text-[#123040]">{value}</span>
      </span>
    </RippleButton>
  )
}

function BottomActions({ shareUrl, onInstall, installed }) {
  const [shareOpen, setShareOpen] = useState(false)
  const [upiOpen, setUpiOpen] = useState(false)

  return (
    <>
      <div
        className={`rise relative mt-auto grid gap-3 pt-4 ${UPI_QR ? 'grid-cols-3' : 'grid-cols-2'}`}
        style={{ animationDelay: '0.36s' }}
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

  // portaled to <body> so the scaled card container can't trap the overlay
  return createPortal(
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
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-[#2E3192] via-[#0A66D6] to-[#22C55E] opacity-55 blur-md" />
          <div className="glass logo-surface relative rounded-3xl p-4 shadow-2xl">
            <img src="/qr/share-card.png" alt="Scan to open this card" width={200} height={200} className="h-[200px] w-[200px] object-contain" />
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
    </div>,
    document.body
  )
}

function QrPopup({ title, subtitle, image, onClose }) {
  return createPortal(
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
    </div>,
    document.body
  )
}
