import { Link, useNavigate } from '@tanstack/react-router'
import { ShoppingCart, ArrowLeft, LogOut, Package, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../lib/AuthContext.jsx'
import { useCart } from '../lib/CartContext.jsx'
import { signOut } from '../lib/supabase.js'

export function Shell({ title, children, back = '/', padForCartBar = false }) {
  const { user, isAdmin } = useAuth()
  const { count } = useCart()
  const navigate = useNavigate()

  return (
    <div className="min-h-[100dvh] bg-[#e2f7f2]">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header
        className="sticky top-0 z-30 border-b border-hairline bg-white/85 backdrop-blur-xl"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="mx-auto flex w-full max-w-5xl items-center gap-1 overflow-hidden px-2 py-2.5 sm:gap-2 sm:px-4 sm:py-3">
          <Link
            to={back}
            className="grid size-9 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-black/5 active:bg-black/10 sm:size-10"
            aria-label="Back"
          >
            <ArrowLeft size={20} strokeWidth={2.4} />
          </Link>

          <h1 className="font-display min-w-0 flex-1 truncate text-base font-semibold text-primary sm:text-lg">
            {title}
          </h1>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            {isAdmin && (
              <Link
                to="/admin"
                className="grid size-9 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-black/5 active:bg-black/10 sm:size-10"
                aria-label="Admin panel"
              >
                <LayoutDashboard size={20} strokeWidth={2.2} />
              </Link>
            )}
            {user && (
              <Link
                to="/orders"
                className="grid size-9 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-black/5 active:bg-black/10 sm:size-10"
                aria-label="My orders"
              >
                <Package size={20} strokeWidth={2.2} />
              </Link>
            )}
            <Link
              to="/cart"
              className="relative grid size-9 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-black/5 active:bg-black/10 sm:size-10"
              aria-label={`Cart, ${count} items`}
            >
              <ShoppingCart size={20} strokeWidth={2.2} />
              {count > 0 && (
                <span className="absolute right-0 top-0.5 grid min-w-[1.15rem] place-items-center rounded-full bg-accent px-1 text-[11px] font-bold leading-[1.15rem] text-white ring-2 ring-white">
                  {count}
                </span>
              )}
            </Link>
            {user && (
              <button
                onClick={async () => {
                  await signOut()
                  navigate({ to: '/order' })
                }}
                className="grid size-9 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-black/5 active:bg-black/10 sm:size-10"
                aria-label="Sign out"
              >
                <LogOut size={20} strokeWidth={2.2} />
              </button>
            )}
          </div>
        </div>
      </header>

      <main
        id="main"
        className={`mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-5 ${
          padForCartBar ? 'has-cart-bar' : ''
        }`}
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)' }}
      >
        {children}
      </main>
    </div>
  )
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="grid place-items-center gap-3 py-20 text-ink-soft">
      <div className="size-8 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

export function Empty({ icon: Icon = Package, title, children }) {
  return (
    <div className="grid place-items-center gap-3 rounded-card bg-white/70 py-16 text-center">
      <Icon size={32} className="text-ink-soft/50" />
      <p className="font-display text-lg font-semibold text-ink">{title}</p>
      {children && <p className="max-w-sm text-sm text-ink-soft">{children}</p>}
    </div>
  )
}

const STATUS = {
  placed: 'bg-amber-100 text-amber-700',
  accepted: 'bg-blue-100 text-blue-700',
  dispatched: 'bg-indigo-100 text-indigo-700',
  rejected: 'bg-red-100 text-red-700',
  delivered: 'bg-green-100 text-green-700',
}

// Customer-facing wording — "accepted" reads as "confirmed" to a shopper.
const STATUS_LABEL = {
  placed: 'Order placed',
  accepted: 'Confirmed',
  dispatched: 'Out for delivery',
  delivered: 'Delivered',
  rejected: 'Rejected',
}

export const statusLabel = (s) => STATUS_LABEL[s] ?? s

export function StatusBadge({ status, label = false }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS[status] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {label ? statusLabel(status) : status}
    </span>
  )
}

/** Horizontal progress rail: placed -> confirmed -> out for delivery -> delivered. */
export function StatusTimeline({ status }) {
  const steps = ['placed', 'accepted', 'dispatched', 'delivered']

  if (status === 'rejected') {
    return (
      <div className="rounded-btn bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
        This order was rejected. Please contact Relief Medical for help.
      </div>
    )
  }

  const at = steps.indexOf(status)
  return (
    <div className="flex items-center">
      {steps.map((st, i) => {
        const doneStep = i <= at
        return (
          <div key={st} className="flex min-w-0 flex-1 items-center last:flex-none">
            <div className="flex min-w-0 flex-col items-center gap-1">
              <span
                className={`size-2.5 shrink-0 rounded-full transition ${
                  doneStep ? 'bg-accent' : 'bg-black/15'
                }`}
              />
              <span
                className={`truncate text-[10px] leading-tight ${
                  doneStep ? 'font-semibold text-ink' : 'text-ink-soft'
                }`}
              >
                {statusLabel(st)}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                className={`mx-1 h-0.5 min-w-3 flex-1 rounded-full transition ${
                  i < at ? 'bg-accent' : 'bg-black/10'
                }`}
                style={{ marginBottom: '14px' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export const inr = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(n) || 0)
