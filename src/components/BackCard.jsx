import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import {
  Phone,
  PhoneCall,
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
  OWNER,
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
      <section
        className="section-surface rise relative mt-auto pt-2"
        style={{ animationDelay: '0.12s' }}
        onClick={stop}
      >
        <SectionDivider icon={Users}>Contact Details</SectionDivider>

        {/* owner card — call + whatsapp orbs */}
        <div className="glass mt-3 flex w-full min-w-0 items-center gap-3 rounded-2xl p-3">
          {OWNER.photo ? (
            <img
              src={OWNER.photo}
              alt={OWNER.name}
              className="h-11 w-11 shrink-0 rounded-full object-cover shadow-md ring-2 ring-indigo-500/35 ring-offset-1 ring-offset-white"
            />
          ) : (
            <div
              className="font-display grid h-11 w-11 shrink-0 place-items-center rounded-full text-[14px] font-bold text-white shadow-md ring-2 ring-indigo-500/35 ring-offset-1 ring-offset-white"
              style={{ background: 'linear-gradient(135deg,#2E3192,#0A66D6)' }}
            >
              {OWNER.initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-bold leading-tight text-[#123040]">
              {OWNER.name}
            </p>
            <p className="truncate text-[9px] font-bold uppercase tracking-[0.1em] text-emerald-700">
              {OWNER.role}
            </p>
            <p className="mt-0.5 flex items-center gap-1 truncate text-[11.5px] font-medium text-[#3E6478]">
              <Phone size={11} className="shrink-0 text-[#0A66D6]" />
              <span className="truncate">{CONTACT.phone}</span>
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <RippleButton
              as="a"
              href={CONTACT.tel}
              aria-label={`Call ${OWNER.name}`}
              className="btn-blue btn-orb h-10 w-10"
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
        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          <ContactChip
            href={CONTACT.telSecondary}
            icon={PhoneCall}
            label="Secondary"
            value={CONTACT.phoneSecondary}
          />
          <ContactChip href={CONTACT.mailto} icon={Mail} label="Email" value="Write to us" />
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
      <section
        className="section-surface rise relative mt-auto pt-2"
        style={{ animationDelay: '0.19s' }}
        onClick={stop}
      >
        <SectionDivider icon={Tags}>Brands Available</SectionDivider>
        <div className="mt-2">
          <BrandMarquee />
        </div>
      </section>

      {/* ---------- 3 · CUSTOMER REVIEWS (rotating real quotes) ---------- */}
      <section
        className="section-surface rise relative mt-auto pt-2"
        style={{ animationDelay: '0.26s' }}
        onClick={stop}
      >
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
        stop={stop}
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

function BottomActions({ shareUrl, stop, onInstall, installed }) {
  const [shareOpen, setShareOpen] = useState(false)
  const [upiOpen, setUpiOpen] = useState(false)

  return (
    <>
      <div
        className={`rise relative mt-auto grid gap-3 pt-4 ${UPI_QR ? 'grid-cols-3' : installed ? 'grid-cols-1' : 'grid-cols-2'}`}
        style={{ animationDelay: '0.36s' }}
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
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-[#2E3192] via-[#0A66D6] to-[#22C55E] opacity-55 blur-md" />
          <div className="glass logo-surface relative rounded-3xl p-4 shadow-2xl">
            <QRCodeSVG
              value={shareUrl}
              size={200}
              level="M"
              fgColor="#232B6E"
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
